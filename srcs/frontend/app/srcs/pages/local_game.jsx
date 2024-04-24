import * as bootstrap	from 'bootstrap';
import ftReact	from "../ft_react";
import Layout 	from "../components/layout";
import BarLayout from "../components/barlayout";
import Platform from "../components/platform";
import Score 	from "../components/score";

const Pong = (props) => {
    const [wins, setWins] = ftReact.useState("");
    const maxScore = 10;
    let maxAngle = 5 * Math.PI / 12;
	let pl = 40;
	let pr = 40;
	let leftPlatformDirection = '';
    let RightPlatformDirection = '';
	let prevYCoordinate = null;
	const keyPress = (ev) => {
        switch (ev.key) {
            case 'ArrowUp':
                RightPlatformDirection = "up";
                break;
            case 'ArrowDown':
                RightPlatformDirection = "down";
                break;
            case 'w':
                leftPlatformDirection = "up";
                break;
            case 's':
                leftPlatformDirection = "down";
                break;
		}
	};
	const keyRelease = (event) => {
        if (event.key === 'w' && leftPlatformDirection === 'up')
            leftPlatformDirection = '';
        else if (event.key === 's' && leftPlatformDirection === 'down')
            leftPlatformDirection = '';
        if (event.key === 'ArrowUp' && RightPlatformDirection === 'up')
            RightPlatformDirection = '';
        else if (event.key === 'ArrowDown' && RightPlatformDirection === 'down')
            RightPlatformDirection = '';
	};
	const cleanup = () => {
		console.log("cleanup");
		document.removeEventListener('keydown', keyPress);
		document.removeEventListener('keyup', keyRelease);
        document.getElementById("gameoverModal")?.removeEventListener('hide.bs.modal', hideModal);
	}
    const hideModal = () => {
        props.route("/games");
    };
	// const touchMove = (ev) => {
	// 	const currentYCoordinate = ev.touches[0].clientY;
	// 	if (currentYCoordinate > prevYCoordinate && platformDirection !== 'down')
	// 	{
	// 		platformDirection = 'down';
	// 		ws.send(JSON.stringify({"message": "down", "d": me}));
	// 	}
	// 	else if (currentYCoordinate < prevYCoordinate && platformDirection !== 'up')
	// 	{
	// 		platformDirection = 'up';
	// 		ws.send(JSON.stringify({"message": "up", "d": me}));
	// 	}
	// 	prevYCoordinate = currentYCoordinate;
	// }

	// const touchEnd = (ev) => {
	// 	platformDirection = '';
	// 	ws.send(JSON.stringify({"message": "stop", "d": me}));
	// }
	ftReact.useEffect(()=>{
        document.addEventListener('keydown', keyPress);
        document.addEventListener('keyup', keyRelease);
        // document.addEventListener("touchmove", touchMove);
        // document.addEventListener("touchend", touchEnd);
        document.getElementById("gameoverModal")?.removeEventListener('hide.bs.modal', hideModal);
        document.getElementById("gameoverModal")?.addEventListener('hide.bs.modal', hideModal);
        if (wins === "")
            requestAnimationFrame(gameLoop);
        return cleanup;
	},[wins])
	let pl_dom = null;
	let pr_dom = null;
	let ball_dom = null;
	let score_board = null;
    let left_score = 0;
    let right_score = 0;
    let ballx = 50;
    let bally = 50;
    let angle = 45;
    const move = () => {
        ballx = Math.cos(angle) + ballx;
        bally = -Math.sin(angle) + bally;
        if (leftPlatformDirection === 'up')
            pl = Math.max(0, pl - 1);
        else if (leftPlatformDirection === 'down')
            pl = Math.min(80, pl + 1);
            if (RightPlatformDirection === 'up')
            pr = Math.max(0, pr - 1);
        else if (RightPlatformDirection === 'down')
            pr = Math.min(80, pr + 1);

    }
    const getRandomArbitrary = (min, max) => {
        return Math.random() * (max - min) + min;
      }
    const restartBall = () => {
        ballx = 50;
        bally = Math.random() * 100;
        let randNum = Math.random();
        if (randNum > 0.5)
            angle = getRandomArbitrary(3 * Math.PI / 4,  5 * Math.PI / 4);
        else
            angle = getRandomArbitrary(- Math.PI / 4,  Math.PI / 4);
    };

    const checkCollisions = () => {
		if (ballx <= 1){
			if (pl - 1 < bally && bally < pl + 21) {
                // Collision with left platform
                let relativeIntersectY = pl + 10 - bally;
                let normalizedRelativeIntersectionY = (relativeIntersectY / 10); // 10 is half of the platform height
                angle = normalizedRelativeIntersectionY * maxAngle;
				ballx = 2;
            }
			else
            {
				ballx = 97;
				right_score += 1;
                restartBall();
            }
        }
		else if ( ballx >= 99.2)
        {
			if (pr - 1 < bally && bally < pr + 21) {
                // Collision with right platform
                let relativeIntersectY = pr + 10 - bally;
                let normalizedRelativeIntersectionY = (relativeIntersectY / 10); // 10 is half of the platform height
                angle = Math.PI - normalizedRelativeIntersectionY * maxAngle;
				ballx = 98;
            }
			else {
				ballx = 3;
				left_score += 1;
                restartBall();
            }
        }
		else if ( bally <= 1) {
			angle = -angle;
			bally = 2;
        }
		else if (bally >= 99) {
			angle = -angle;
			bally = 98;
        }
    }
	const gameLoop = () => {
        checkCollisions();
        move()
		if (ball_dom) {
			ball_dom.style.left = `${ballx - 1}%`;
        	ball_dom.style.top = `${bally - 1}%`;
        	pl_dom.style.top = `${pl}%`;
        	pr_dom.style.top = `${pr}%`;
			score_board.textContent = `${left_score}:${right_score}`;
		} else {
			pl_dom = document.getElementById("pl-left");
			pr_dom = document.getElementById("pl-right");
			ball_dom = document.getElementById("ball");
			score_board = document.getElementById("score-board");
		}
        if (left_score === maxScore || right_score === maxScore) {
            new bootstrap.Modal('#gameoverModal', {}).show();
            if (right_score > left_score)
                setWins("Right player wins!");
            else
                setWins("Left player wins!");
            return ;
        }
		requestAnimationFrame(gameLoop);
	}
	return (
		<BarLayout route={props.route}>
            <div style={{
                border: "2px solid rgb(248, 2, 191)",
                borderRadius: "1%",
                boxShadow: "0 0 50px rgba(248, 2, 191, 0.5)",
                padding: 0,
                width: "95%",
                height: "95%",
                position: "relative",
                touchAction: "none",
            }}>
                <Score score={{s1: left_score, s2: right_score}}/>
                <div id="ball" style={{
                    height: "2%",
                    aspectRatio: "1/1",
                    backgroundColor: "rgb(216, 223, 24)",
                    borderRadius: "100%",
                    position: "absolute",
                    left: `${ballx}%`,
                    top: `${bally}%`,
                }}/>
                <Platform y={pl}/>
                <Platform right y={pr}/>
            </div>
            <div class="modal fade" id="gameoverModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" >
                    <div class="modal-content" >
                    <div class="modal-header" >
                        <h5 class="modal-title" id="exampleModalLabel">Game over</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" >
                        <h3>{wins}</h3>
                    </div>
                    <div class="modal-footer justify-content-center" >
                        <button className="btn btn-primary" data-bs-dismiss="modal">Go Back to Main Menu</button>
                        </div>
                    </div>
                </div>
            </div>
		</BarLayout>
	);
};

export default Pong;