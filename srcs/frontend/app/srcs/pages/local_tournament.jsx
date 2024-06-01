import ftReact          from "../ft_react";
import { apiClient }    from "../api/api_client";
import BarLayout        from "../components/barlayout";

const MaxPlayersForm = (props) => (
    <div className="d-flex flex-column gap-3">
        <input
            className="form-control"
            placeholder="Players count"
            type="number"
            min="3"
            max="10"
            required
            onChange={(event)=>{
                return event.target.value;
            }}
        />
        <button
            className="btn btn-outline-primary mb-3"
            onClick={(event)=>{
                event.preventDefault();
                const count = event.target.previousSibling.value;
                if (!count || count < 3 || count > 10)
                {
                    props.error("You cannot create tournament with less than 3 players!");
                    return ;
                }
                props.inputs(Array.from({length: count}, (_, i) => 
                    <input
                        className="form-control"
                        placeholder={`Player ${i + 1} name`}
                        required
                        type="text"
                        onChange={(event)=>{    
                            return event.target.value;
                        }}
                    />
                ));
                props.error("");
            }}
        >
            Start new tournament
        </button>
    </div> 
)

const NamesForm = (props) => (
        <div className="d-flex">
        <form
            className="d-flex flex-column gap-3"
            onSubmit={(event)=>{
                event.preventDefault();
                const players = [];
                for (let i = 0; i < event.target.length - 1; i++)
                {
                    if (players.includes(event.target[i].value))
                    {
                        props.error("Names must be unique");
                        return ;
                    }
                    players.push(event.target[i].value);
                }
                const games = [];
                let stragler = null;    
                for (let i = 1; i < event.target.length -1 ; i += 2)
                {
                    games.push({player1: players[i - 1], player2: players[i], winner: null, score1: 0, score2: 0});
                }
                if ((event.target.length - 1) % 2 !== 0)
                    stragler = event.target.length - 1 ;
                props.error("");
                const newGameState = {games: games, players: players, winner: null, started: true, stragler: players[stragler - 1]};
                props.gameState(newGameState);
                history.pushState({gameState: newGameState}, "", "");
            }}
        >
            {props.inputElements}
            <button 
                className="btn btn-primary"
                type="submit"
                Submit Names
            >
                Set Names
            </button>
        </form>
    </div>
)

const CurrentRound = (props) => (
    <div className="d-flex flex-column gap-3 text-break" style={{maxWidth: "100ch"}}>
        {props.gameState.games.map((game, index) => (
            <div className="d-flex flex-column gap-3 card p-2">
                <span>{`Game ${index + 1}`}</span>
                <h5>{game.player1}</h5>
                <h5>vs</h5>
                <h5>{game.player2}</h5>
                {game.winner && 
                    <div className="d-flex flex-column">
                        <h5>Winner: {game.winner}</h5>
                            <h6>Left: {`${game.score1}`}</h6>
                            <h6>Right: {`${game.score2}`}</h6>
                    </div>
                }
            </div>
        ))
        }
        {props.gameState.stragler &&
            <div className="d-flex flex-column gap-3 card p-2">
                <span>Waits for next round</span>
                <h5>{props.gameState.stragler}</h5>
            </div>
        }
        <div className="d-flex flex-column gap-3 card p-2">
        {props.gameState.players.map((player, index) => {
            return (
                    <div className="d-flex flex-row gap-3 justify-content-center">
                        <span>{`Player ${index + 1}: `}</span>
                        <h5>{player}</h5>
                    </div>
                );
            })
        }
        </div>
        <button 
            className="btn btn-primary"
            onClick={()=>{
                props.route("/local-game", {gameState: props.gameState});
            }}
        >
            Start Next Game
        </button>
    </div>
)

const RestartTournament = (props) => (
    <div className="d-flex flex-column card p-5">
        <h2>Tournament Ended</h2>
        <h3>Winner: {props.data.winner}</h3>
        <button
            className="btn btn-primary"
            onClick={()=>{
                props.gameState({games: [], players: 0, winner: null, started: false, stragler: null});
            }}
        >
            Restart local tournament
        </button>
    </div>
)

const LocalTournament = (props) => {
    const [namesInput, setNamesInput] = ftReact.useState(0);
    const [gameState, setGameState] = ftReact.useState(history.state?.gameState || {games: [], players: 0, winner: null, started: false, stragler: null});
    const [error, setError] = ftReact.useState("");
    ftReact.useEffect(async ()=>{
        const getWinners = async (games) => {
            let winners = [];
            for (let i = 0; i < gameState.games.length; i++)
            {
                if (gameState.games[i].winner === null)
                    return ;
                winners.push(gameState.games[i].winner);
            }
            return winners;
        };

        const createNewRound = async (winners) => {
            const games = [];
            if (gameState.stragler)
                winners.push(gameState.stragler);
            for (let i = 0; i < winners.length -1 ; i += 2)
            {
                games.push({player1: winners[i], player2: winners[i + 1], winner: null, score1: 0, score2: 0});
            }
            let stragler = null;
            if (winners.length % 2 !== 0)   
                stragler = winners[winners.length - 1];
            setGameState({games: games, players: gameState.players, winner: null, started: true, stragler: stragler});
        };

        // Main effect
        const continueTournament = async () => {
            let winners = await getWinners(gameState.games);
            if (!winners)
                return ;
            if (winners.length === 1)
            {
                if (gameState.stragler)
                {
                    winners.push(gameState.stragler);
                    let last_game = {player1: winners[0], player2: winners[1], winner: null, score1: 0, score2: 0};
                    setGameState({games: [last_game], players: gameState.players, winner: null, started: true, stragler: null});
                }
                else
                    setGameState({games: [], players: 0, winner: winners[0], started: true, stragler: null});
            }
            else
                await createNewRound(winners);
        }
        if (gameState.players !== 0)
            await continueTournament();
    }
    , [gameState]);
    return (
        <BarLayout route={props.route}>
            {
                !namesInput &&
                gameState.players === 0 &&
                !gameState.winner &&
                <MaxPlayersForm inputs={setNamesInput} error={setError}/>
            }
            {
                namesInput &&
                !gameState.started &&
                <NamesForm error={setError} gameState={setGameState} inputElements={namesInput}/>
            }
            {
                !gameState.winner &&
                gameState.started && 
                <CurrentRound gameState={gameState} route={props.route}/>
            }
            {
                gameState.winner &&
                <RestartTournament gameState={setGameState} data={gameState}/> 
            }
            {error && <div className="alert alert-danger">{error}</div>}
        </BarLayout>
    );
}

export default LocalTournament;