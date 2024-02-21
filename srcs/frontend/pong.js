document.addEventListener("DOMContentLoaded", function(event) {
	const field = document.getElementById('field');
    const ball = document.getElementById('ball');
    const platform_1 = document.getElementById('platform_1');
    const platform_2 = document.getElementById('platform_2');
    const scoreboard = document.getElementById('scoreboard');
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    let ballX = field.clientWidth / 2 + field.offsetLeft;
    let ballY = field.offsetTop + 5;
    
    let platformY_1 = field.clientHeight / 2 - 100;
    let platformY_2 = field.clientHeight / 2  - 100;
    
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
        ball.style.left = `${ballX - 10}px`;
        ball.style.top = `${ballY - 10}px`;
        platform_1.style.top = `${platformY_1 + 2}px`;
        platform_2.style.top = `${platformY_2 + 2}px`;
        requestAnimationFrame(gameLoop);
    }
    let dx = field.clientWidth / 100;
    let dy = field.clientHeight / 100;
    platform_1.style.height = `${dy * 20}px`;
    platform_2.style.height = `${dy * 20}px`;
    addEventListener("resize", (event) => {
        dx = field.clientWidth / 100;
        dy = field.clientHeight / 100;
        platform_1.style.height = `${dy * 20}px`;
        platform_2.style.height = `${dy * 20}px`;
    });
    ws.addEventListener('message', ev => {
        const data = JSON.parse(ev.data);
        if (data.side === 'right')
            me = 'right'
        ballX = field.offsetLeft + dx * data.x;
        ballY = field.offsetTop + dy * data.y;
        platformY_1 = field.offsetTop + dy * data.p1;
        platformY_2 = field.offsetTop + dy * data.p2;
    })
    gameLoop();
	
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
})