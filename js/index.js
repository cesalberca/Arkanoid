/**********
Arkanoid
Made by César Alberca @cesalberca
**********/

// MIT License

// Copyright (c) 2016 César Alberca Agelán @cesalberca

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

let arkanoid = (function () {
  'Use strict'
  
  let c = document.querySelector('#arkanoid')
  let ctx = c.getContext('2d')
  let idAnimationFrame
  
  // Local storage related stuff
  let localStorageId = 'arkano-id' // He he he
  let scores = []
  let playername
  let playerEnteredName = false
  let maxScore = 0
  
  let WIDTH = window.innerWidth
  let HEIGHT = window.innerHeight
  
  let spawnArea = HEIGHT * 30 / 100
  let bricks
  let gutterBricks = 10
  let MAX_BOUNCE_ANGLE = 5 * Math.PI / 12
  
  let balls
  let paddle
  
  let level = 1
  let score = 0
  let lives = 3
  
  // Default game options
  let gameOptions = {
    bricksLives: 1,
    colsBricks: 5,
    rowsBricks: 2,
    numberOfBalls: 1,
    speedBall: 10,
    radiusBall: 15,
    widthPaddle: 200,
    areBricksRotating: false
  }
  
  // This variable holds wether the player has clicked the canvas or not in order to know when to release the balls
  let playerClicked
  
  /***
  * INIT
  */
  function setUpGameOptions () {
    if (level >= 2)
      gameOptions.areBricksRotating = true  

    if (level % 3 === 0)
      gameOptions.numberOfBalls *= 2

    if (level % 5 === 0)
      gameOptions.speedBall += 1

    if (level % 2 === 0) {
      gameOptions.colsBricks += 3
      gameOptions.rowsBricks += 1
    }
    
    if (level % 7 === 0)
      gameOptions.bricksLives++
  }
  
  /***
  * UTILS
  */
  function getRandomAngle () {
    return getRandomInt(0, 360)
  }
  
  function getRandomInt (min, max) {
    return Math.random() * (max - min) + min
  }
  
  function getDistance (fromX, fromY, toX, toY) {
    let dX = Math.abs(fromX - toX)
    let dY = Math.abs(fromY - toY)

    return Math.sqrt((dX * dX) + (dY * dY))
  }
  
  function convertDegreesToRadians (degrees) {
    return degrees * Math.PI / 180
  }
  
  function clearCanvas () {
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
  }
  
  /***
  * GUI
  */
  function drawLives () {
    ctx.save()
    ctx.font = '1.25rem Arial'
    ctx.fillStyle = '#0095DD'
    ctx.fillText('Lives: ' + lives, c.width - 80, 40)
    ctx.restore()
  }
  
  function drawMaximumScore () {
    ctx.save()
    ctx.font = '1.25rem Arial'
    ctx.fillStyle = '#0095DD'
    ctx.fillText('Max score: ' + getMaximumScore().maxScore, 10, 60)
    ctx.fillText('Playername: ' + getMaximumScore().playername, 10, 80)
    ctx.restore()
  }
  
  function drawScore () {
    ctx.save()
    ctx.font = '1.25rem Arial'
    ctx.fillStyle = '#0095DD'
    ctx.fillText('Score: ' + score, 10, 40)
    ctx.restore()
  }
  
  function drawLevel () {
    ctx.save()
    ctx.font = '1.25rem Arial'
    ctx.fillStyle = '#0095DD'
    ctx.fillText('Level: ' + level, 10, c.height - 10)
    ctx.restore()
  }
  
  /***
  * BRICKS
  */
  
  /**
  * Generates de array of bricks
  */
  function generateBricks () {
    // Initialize array
    bricks = []
    
    let widthCell = WIDTH / gameOptions.colsBricks
    // Need to spawn the bricks in the spawn area, not in the whole canvas
    let heightCell = spawnArea / gameOptions.rowsBricks
    
    for (let i = 0; i < gameOptions.colsBricks; i++) {
      bricks[i] = []
      for (let j = 0; j < gameOptions.rowsBricks; j++) {
        bricks[i][j] = {
          x: widthCell * i + gutterBricks / 2, 
          y: heightCell * j + gutterBricks / 2, 
          width: widthCell - gutterBricks / 2, 
          height: heightCell - gutterBricks / 2,
          angle: gameOptions.areBricksRotating ? convertDegreesToRadians(getRandomAngle()) : 0,
          lives: gameOptions.bricksLives
        }
      }
    }
  }
  
  /**
  * Paints on the screen the bricks
  */
  function drawBricks () {
    let translateX
    let translateY
    
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        // Only paint them if they are alive
        if (bricks[i][j].lives !== 0) {
          ctx.save()
          
          // We move the origin to the center of each brick
          translateX = bricks[i][j].x + bricks[i][j].width / 2
          translateY = bricks[i][j].y + bricks[i][j].height / 2
          
          ctx.translate(translateX, translateY)
          // Our angle is in degrees so we convert it to radians
          ctx.rotate(bricks[i][j].angle)
          ctx.translate(-translateX, -translateY)
          ctx.fillRect(
            bricks[i][j].x, 
            bricks[i][j].y, 
            bricks[i][j].width, 
            bricks[i][j].height
          )
          ctx.restore()
        }
      }
    }
  }
  
  /**
  * Rotates the bricks given their angle.
  */
  function rotateBricks () {
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        // We avoid getting overflowed resetting the angle once is 360º
        if (bricks[i][j].lives !== 0) {
          if (bricks[i][j].angle % convertDegreesToRadians(360) === 0)
            bricks[i][j].angle = 0
        
          bricks[i][j].angle += convertDegreesToRadians(1)  
        }
      }
    }
  }
  
  /***
  * BALLS
  */
  
  /**
  * Generates de balls
  */
  function generateBalls () {
    balls = []
    
    // We need to pregenerate the radius in order to position the ball on top of our paddle.
    let thisRadius
    
    for (let i = 0; i < gameOptions.numberOfBalls; i++) {
      thisRadius = gameOptions.radiusBall
      
      balls[i] = {
        x: WIDTH / 2,
        y: HEIGHT - paddle.height - thisRadius - 10,
        radius: thisRadius,
        speed: gameOptions.speedBall,
        dx: getRandomInt(-1, 1),
        // It's important when the game generates that the balls go up and not down!
        dy: getRandomInt(-1, -0.9),
        status: 1,
        isBallReleased: false
      }
    }
  }
  
  /**
  * Draws in the screen the balls
  */
  function drawBalls () {
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].status !== 0) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(balls[i].x, balls[i].y, balls[i].radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
        ctx.restore()  
      }
    }
  }
  
  /**
  * Moves the balls
  */
  function moveBalls () {
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].status !== 0 && balls[i].isBallReleased) {
        balls[i].x += balls[i].dx * gameOptions.speedBall
        balls[i].y += balls[i].dy * gameOptions.speedBall  
      }
    }
  }
  
  /**
  * Releases the balls into the wild
  */
  function releaseBalls () {
    for (let i = 0; i < balls.length; i++) {
      (function (index) {
        setTimeout(function () {
          balls[index].isBallReleased = true
      }, index * 500)
      })(i)
    }
  }
  
  /**
  * Until the user hasnt clicked on the canvas the balls arent released
  */
  function ballsFollowPaddle () {
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isBallReleased)
        balls[i].x = paddle.x + paddle.width / 2
    }
  }
  
  /**
  * Bounces a ball to the opposite direction if no direction is given. The direction given should be -1 or 1
  */
  function bounceBallX (ball, dir) {
    if (arguments.length === 1)
      ball.dx = -1 * ball.dx
    else if (arguments.length === 2)
      ball.dx = dir * ball.dx
  }
  
  function bounceBallY (ball, dir) {
    if (arguments.length === 1)
      ball.dy = -1 * ball.dy
    else if (arguments.length === 2)
      ball.dy = dir * ball.dy
  }
  
  function setNewDirectionBall (ball, dx, dy) {
    ball.dx = dx
    ball.dy = dy
  }
  
  /**
  * PADDLE
  */
  
  /**
  * Generates the paddle which the player can control
  */
  function generatePaddle () {
    let paddleWidth = gameOptions.widthPaddle
    let paddleHeight = 20
    
    paddle = {
      x: (WIDTH / 2) + (paddleWidth / 2),
      y: (HEIGHT - paddleHeight),
      width: paddleWidth,
      height: paddleHeight
    }
  }
  
  /**
  * Draw paddle
  */
  function drawPaddle () {
    ctx.save()
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
    ctx.restore()
  }
  
  /**
  * Event for the paddle to move to the cursor
  */
  c.addEventListener('mousemove', function (e) {
      paddle.x = e.clientX - paddle.width / 2
  })
  
  /***
  * COLLISIONS
  */
  
  /**
  * Handle the collision with the width and height of the game area
  */
  function checkCollisionBallsWithWalls () {
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].status !== 0) {
        // Check if the ball is going out of the x coordinate given the width of the screen
        if (balls[i].x + balls[i].radius > WIDTH || balls[i].x < balls[i].radius)
          bounceBallX(balls[i])

        // Check if the ball is going out of the y coordinate given the height of the screen
        if (balls[i].y < balls[i].radius) {
          bounceBallY(balls[i])
        } else if (balls[i].y + balls[i].radius > HEIGHT) {
          // If it went out of the canvas by the bottom side we decrease a live and destroy the ball
          balls[i].status = 0
          lives--
        }  
      }
    }
  }
  
  /**
  * Checks for all the possible collisions with each brick that is alive and each ball
  */
  function checkCollisionsBallsWithBricks () {
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        for (let k = 0; k < balls.length; k++) {
          if (bricks[i][j].lives !== 0 && balls[k].status !== 0 && collideCircleWithRotatedRectangle(balls[k], bricks[i][j])) {
            // We need to take into account whether the ball collides in the side of a brick or on top/bottom part.
            // Checking collision with bottom/top part
            if (bricks[i][j].y + bricks[i][j].height < balls[k].y + balls[k].radius) {
              bounceBallY(balls[k])  
            } else {
              bounceBallX(balls[k])
            }

            // This kills the brick
            bricks[i][j].lives--
            score++
          }
        }
      }
    }
  }
  
  /**
  * Checks the collisions of all the balls with the paddle
  */
  function checkCollisionBallsWithPaddle () {
    let distanceFromEdge
    , normalizedDistanceFromEdge
    , bounceAngle
    , dx
    , dy
    
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].status !== 0) {
        if (checkCollisionCircleWithRectangle(balls[i], paddle)) {
          // When the difference is greater the angle of reflection is too
          distanceFromEdge = balls[i].x - (paddle.x + paddle.width / 2)
          // We need to calculate the percentage off from the edge only from one half
          normalizedDistanceFromEdge = distanceFromEdge / (paddle.width / 2)
          bounceAngle = normalizedDistanceFromEdge * MAX_BOUNCE_ANGLE
          
          // We discard entirely the previous direction
          dx = Math.sin(bounceAngle)
          dy = -Math.cos(normalizedDistanceFromEdge)
          
          setNewDirectionBall(balls[i], dx, dy)
        }
      }
    }
  }
    
  /**
  * Checks a collision between a circle and a rectangle
  */
  function checkCollisionCircleWithRectangle (circle, rect) {
    if (circle.y + circle.radius > rect.y && circle.x + circle.radius > rect.x && circle.x - circle.radius < rect.x + rect.width)
      return true
    else
      return false
  }
  
  /**
  * Calculates if there is a collision between a circle and a rectangle. The rectangles' x and y refer to the top left corner.
  */
  function collideCircleWithRotatedRectangle (circle, rect) {
    let rectCenterX = rect.x + rect.width / 2
    let rectCenterY = rect.y + rect.height / 2

    // Rotate circle's center point back
    let unrotatedCircleX = Math.cos(rect.angle) * (circle.x - rectCenterX) - 
            Math.sin(rect.angle) * (circle.y - rectCenterY) + rectCenterX
    let unrotatedCircleY = Math.sin(rect.angle) * (circle.x - rectCenterX) + 
            Math.cos(rect.angle) * (circle.y - rectCenterY) + rectCenterY

    // Closest point in the rectangle to the center of circle rotated backwards(unrotated)
    let closestX
    , closestY

    // Find the unrotated closest x point from center of unrotated circle
    if (unrotatedCircleX < rect.x)
        closestX = rect.x
    else if (unrotatedCircleX > rect.x + rect.width)
        closestX = rect.x + rect.width
    else
        closestX = unrotatedCircleX

    // Find the unrotated closest y point from center of unrotated circle
    if (unrotatedCircleY < rect.y)
        closestY = rect.y
    else if (unrotatedCircleY > rect.y + rect.height)
        closestY = rect.y + rect.height
    else
        closestY = unrotatedCircleY

    // Determine collision
    let collision = false
    let distance = getDistance(unrotatedCircleX, unrotatedCircleY, closestX, closestY)

    if (distance < circle.radius)
        collision = true
    else
        collision = false

    return collision
  }
  
  /**
  * SCORE AND LEVELS
  */
  function isLevelOver () {
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        if (bricks[i][j].lives > 0)
          return false
      }
    }
    return true
  }
  
  function didPlayerRunOutOfBalls () {
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].status > 0)
        return false
    }
    return true
  }
  
  function isGameOver () {
    if (lives === 0)
      return true
    else
      return false
  }
  
  /***
  * SCORE
  */
  function askForPlayersName () {
    playername = prompt('Introduce your name')
    playerEnteredName = true
  }
  
  /**
  * Gets the score of a single player
  */
  function retrieveSinglePlayerScore (playername, scores) {
    let singlePlayerScores = []
    scores.forEach(function (score) {
      if (score.playername === playername)
        singlePlayerScores.push(score)
    })

    return singlePlayerScores
  }
  
  /**
  * Gets an array of object scores from the local storage
  */
  function getScores () {
    let scores = localStorage.getItem(localStorageId)
    let parsedScores = JSON.parse(scores)
    return parsedScores
  }
  
  /**
  * Sets a score object to the local storage with the player's name
  */
  function setScore (playername, score) {
    // We have to retrieve first the scores array to add the new score in order to not delete the rest of the scores
    let scores = getScores()
    
    // If this is the first time this game is played we initialize the array of scores
    if (!scores)
      scores = []
    
    // If the playername is already in the local storage, and it's score is bigger than the last one, update it.
    let playerScore = retrieveSinglePlayerScore(playername, scores)
    
    let newScore = {}

    // If this player already has set an score, lets update his score 
    if (playerScore.length !== 0) {
      // Lets update it only if its his biggest score yet
      // Redo this
      if (score > playerScore[0].score) {
        console.log('This is the highest score for that player or the same')
        // update only, dont add
        // Fucking fuck
        playerScore[0].score = score
        playerScore[0].timestamp = new Date()
      } else {
        // If the score isnt the highest just end the function
        console.log('Not the highest score for that player')
        return
      }
    } else {
      // If playerScore is null, that means this is the first time that player has player this game, so lets save his score
      console.log('Player doesnt exist')
      newScore.playername = playername
      newScore.score = score
      newScore.timestamp = new Date()
      scores.push(newScore)
    }
    
    // Put the object into storage
    localStorage.setItem(localStorageId, JSON.stringify(scores))
  }
  
  function getMaximumScore () {
    let maxScoreObject = {
      playername: '',
      maxScore: 0,
      timestamp: null
    }
    
    let scores = getScores()
    
    if (scores) {
      scores.forEach(function (score) {
        if (score.score > maxScoreObject.maxScore) {
          maxScoreObject.playername = score.playername
          maxScoreObject.maxScore = score.score
          maxScoreObject.timestamp = score.timestamp
        }
      })  
    }
    
    return maxScoreObject
  }
  
  /***
  * AI
  */
  function skynet () {
    for (let i = 0; i < balls.length; i++)
      paddle.x = (balls[i].x - paddle.width / 2)
  }
  
  /***
  * SETUP
  */
  c.addEventListener('click', function () {
    playerClicked = true
    releaseBalls()
  })
  
  function init () {
    c.width = WIDTH
    c.height = HEIGHT
    
    playerClicked = false
    setUpGameOptions()
    
    generateBricks()
    generatePaddle()
    generateBalls()
    
    if (!playerEnteredName)
      askForPlayersName()
    
    idAnimationFrame = window.requestAnimationFrame(draw)
  }
  
  /**
  * Main game loop
  */
  function draw () {
    if (!isGameOver()) {
      clearCanvas()
      
      drawBalls()
      drawBricks()
      drawPaddle()
      
      if (gameOptions.areBricksRotating)
        rotateBricks()

      // If the player hasnt clicked the canvas dont release the balls
      if (playerClicked) {
        moveBalls()
        ballsFollowPaddle()
      } else {
        ballsFollowPaddle()
      }
        
      checkCollisionsBallsWithBricks()
      checkCollisionBallsWithPaddle()
      checkCollisionBallsWithWalls()
            
      drawScore()
      drawLives()
      drawLevel()
      drawMaximumScore()
      
      if (!isLevelOver()) {
        idAnimationFrame = window.requestAnimationFrame(draw)
      } else {
        playerClicked = false
        level++
        lives++
        // We need to reset the animation frame in order to prevent the game from going to more speed
        cancelAnimationFrame(idAnimationFrame)
        init()
      }
      
      if (!isLevelOver() && didPlayerRunOutOfBalls()) {
        generateBalls()
        playerClicked = false
      }
      
    } else {
      setScore(playername, score)
    }
  }
  
  init()
})()