function runGame() {
    const field = document.getElementById('field');
    const ball = document.getElementById('ball');
    const platform_1 = document.getElementById('platform_1');
    const platform_2 = document.getElementById('platform_2');
    const scoreboard = document.getElementById('scoreboard');
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    let ballX = 50;
    let ballY = 50;
    
    let platformY_1 = 40;
    let platformY_2 = 40;
    
    let score_1 = 10;
    let score_2 = 10;
    let me = 'left';
    function updateScoreBoard() {
        scoreboard.textContent = `${score_1}:${score_2}`;
    }
    updateScoreBoard();

    let platformDirection = '';

    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowUp':
                ws.send(JSON.stringify({"message": "up", "d": me}));
                platformDirection = 'up';
                break;
            case 'ArrowDown':
                ws.send(JSON.stringify({"message": "down", "d": me}));
                platformDirection = 'down';
                break;
        }
    }

    function handleKeyRelease(event) {
        if (event.key === 'ArrowUp' && platformDirection === 'up')
        {
            ws.send(JSON.stringify({"message": "stop", "d": me}));
            platformDirection = '';
        }
        else if (event.key === 'ArrowDown' && platformDirection === 'down')
        {
            ws.send(JSON.stringify({"message": "stop", "d": me}));
            platformDirection = '';
        }
    }

    function gameLoop() {
        ball.style.left = `${ballX - 1}%`;
        ball.style.top = `${ballY - 1}%`;
        platform_1.style.top = `${platformY_1}%`;
        platform_2.style.top = `${platformY_2}%`;
        updateScoreBoard();
        requestAnimationFrame(gameLoop);
    }
    addEventListener("resize", (event) => {
        platform_1.style.height = "20%";
        platform_2.style.height = "20%";
    });
    ws.addEventListener('message', ev => {
        const data = JSON.parse(ev.data);
        if (data.side === 'right')
            me = 'right'
        ballX = data.x;
        ballY = data.y;
        if ('p1' in data)
            platformY_1 = data.p1;
        if ('p2' in data)
            platformY_2 = data.p2;
        if ('s1' in data)
        {
            score_1 = data.s1;
            score_2 = data.s2;
        }
    })
    gameLoop();
	
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
}

document.addEventListener("readystatechange", function(event) {
    if (event.target.readyState === "complete")
    	runGame();
})
