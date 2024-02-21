document.addEventListener("DOMContentLoaded", function(event) {
	const field = document.getElementById('field');
    const ball = document.getElementById('ball');
    const platform_1 = document.getElementById('platform_1');
    const platform_2 = document.getElementById('platform_2');
    const scoreboard = document.getElementById('scoreboard');
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    let ballX = field.clientWidth / 2 + field.offsetLeft;
    let ballY = field.offsetTop + 5;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    
    let platformY_1 = field.clientHeight / 2 - 100;
    let platformY_2 = field.clientHeight / 2  - 100;
    platform_1.style.top = `${platformY_1}px`;
    platform_2.style.top = `${platformY_2}px`;
    
    let score_1 = 10;
    let score_2 = 10;
    function updateScoreBoard() {
        scoreboard.textContent = `${score_1}:${score_2}`;
    }
    updateScoreBoard();

    let angle = 45;
    let platformDirection_1 = '';
    let platformDirection_2 = '';

    function moveBall() {
        ballX += 20 * Math.cos(angle);
        ballY += 20 * Math.sin(angle);
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
    }

    function movePlatform_1() {
        if (!platformDirection_1)
            return ;
        let newPlatformY;
        if (platformDirection_1 === 'up')
            newPlatformY = platformY_1 - 40;
        else if (platformDirection_1 === 'down')
            newPlatformY = platformY_1 + 40;
        if (newPlatformY < field.offsetTop)
            newPlatformY = field.offsetTop + 2;
        else if (newPlatformY + 200 >= field.clientHeight + field.offsetTop)
            newPlatformY = field.clientHeight + field.offsetTop - 198;
        platformY_1 = newPlatformY;
        platform_1.style.top = `${platformY_1}px`;
    }

    function movePlatform_2() {
        if (!platformDirection_2)
            return ;
        let newPlatformY;
        if (platformDirection_2 === 'up')
            newPlatformY = platformY_2 - 40;
        else if (platformDirection_2 === 'down')
            newPlatformY = platformY_2 + 40;
        if (newPlatformY < field.offsetTop)
            newPlatformY = field.offsetTop + 2;
        else if (newPlatformY + 200 >= field.clientHeight + field.offsetTop)
            newPlatformY = field.clientHeight + field.offsetTop - 198;
        platformY_2 = newPlatformY;
        platform_2.style.top = `${platformY_2}px`;
    }

    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowUp':
                ws.send(JSON.stringify({"message": "up"}));
                platformDirection_2 = 'up';
                break;
            case 'ArrowDown':
                ws.send(JSON.stringify({"message": "down"}));
                platformDirection_2 = 'down';
                break;
            case 'w':
                platformDirection_1 = 'up';
                break;
            case 's':
                platformDirection_1 = 'down';
                break;
        }
    }

    function handleKeyRelease(event) {
        switch (event.key) {
            case 'ArrowUp':
                if (platformDirection_2 === 'up')
                    platformDirection_2 = '';
                break;
            case 'ArrowDown':
                if (platformDirection_2 === 'down')
                    platformDirection_2 = '';
                break;
            case 'w':
                if (platformDirection_1 === 'up')
                    platformDirection_1 = '';
                break;
            case 's':
                if (platformDirection_1 === 'down')
                    platformDirection_1 = '';
                break;
        }
    }

    function checkCollision() {
		const ballRect = ball.getBoundingClientRect();
        const platformRect_1 = platform_1.getBoundingClientRect();
        const platformRect_2 = platform_2.getBoundingClientRect();
        if (
            platformRect_1.top < ballRect.top
            && platformRect_1.bottom > ballRect.bottom
            && platformRect_1.right >= ballRect.left
        )
        {
            angle = angle - 180;
            score_1++;
            updateScoreBoard();
        }
        else if (
            platformRect_2.top < ballRect.top
            && platformRect_2.bottom > ballRect.bottom
            && platformRect_2.left <= ballRect.right
        )
        {
            angle = angle - 180;
            score_2++;
            updateScoreBoard();
        }
		else if (ballRect.left <= field.offsetLeft)
        {
            ballX = field.clientWidth + field.offsetLeft - 10;
            score_1--;
            updateScoreBoard();
        }
        else if (ballRect.right >= (field.clientWidth + field.offsetLeft))
        {
            ballX = field.offsetLeft + 10;
            score_2--;
            updateScoreBoard();
        }
		else if (
            ballRect.top <= field.offsetTop
            || ballRect.bottom >= (field.clientHeight + field.offsetTop)
        )
            angle = -angle;
    }

    function gameLoop() {
        //movePlatform_1();
        //movePlatform_2();
        //moveBall();
        //checkCollision();
        requestAnimationFrame(gameLoop);
    }
    const dx = field.clientWidth / 100;
    const dy = field.clientHeight / 100;
    ws.addEventListener('message', (ev)=>{
        const data = JSON.parse(ev.data);
        const x = data.x;
        const y = data.y;
        const p1 = data.p1;
        const p2 = data.p2;
        
        ballX = field.offsetLeft + dx * x;
        ballY = field.offsetTop + dy * y;
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;

        platformY_2 = field.offsetTop + dy * p2;
        platform_2.style.top = `${platformY_2}px`;
    })
    gameLoop();
	
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
})