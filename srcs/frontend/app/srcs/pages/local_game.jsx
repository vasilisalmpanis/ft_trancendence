import ftReact      from "../ft_react";
import BarLayout    from "../components/barlayout";


const LocalGame = (props) => {
    return (
        <BarLayout route={props.route}>
        <div>
            <h1>Local Game</h1>
        </div>
        </BarLayout>
    );
}

export default LocalGame;