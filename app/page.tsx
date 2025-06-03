'use client';
import { useState, useEffect, useCallback } from 'react';

// 定义游戏网格大小、单元格大小和初始速度
const GRID_SIZE = 20; // 游戏网格的大小
const CELL_SIZE = 20; // 每个单元格的大小
const INITIAL_SPEED = 150; // 初始速度（毫秒）

// 定义方向类型和位置类型
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; // 方向类型
type Position = { x: number; y: number }; // 位置类型

export default function SnakeGame() {
  // 定义状态变量
  const [playerName, setPlayerName] = useState(''); // 玩家姓名
  const [gameStarted, setGameStarted] = useState(false); // 游戏是否开始
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]); // 蛇的位置
  const [food, setFood] = useState<Position>({ x: 5, y: 5 }); // 食物的位置
  const [direction, setDirection] = useState<Direction>('RIGHT'); // 当前方向
  const [gameOver, setGameOver] = useState(false); // 游戏是否结束
  const [score, setScore] = useState(0); // 得分
  const [speed, setSpeed] = useState(INITIAL_SPEED); // 游戏速度
  const [countdown, setCountdown] = useState<number | null>(null); // 新增倒计时状态变量

  // 生成食物的函数
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    // 确保食物不会出现在蛇身上
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) return generateFood();
    return newFood;
  }, [snake]);

  // 移动蛇的函数
  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };

      // 根据方向更新蛇头位置
      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // 检查是否撞墙
      if (
        head.x < 0 || head.x >= GRID_SIZE || 
        head.y < 0 || head.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // 检查是否撞到自己
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];
      
      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood());
        setScore(prev => prev + 1);
        // 每吃5个食物，速度加快
        if (score > 0 && score % 5 === 0) {
          setSpeed(prev => Math.max(prev - 10, 50));
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, generateFood, score]);

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止默认行为，防止页面滚动
      e.preventDefault();

      // 根据按键更新方向
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // 游戏循环
  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  // 重置游戏
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  };

  // 开始游戏
  const startGame = () => {
    if (playerName.trim()) {
      setCountdown(3); // 设置倒计时为3秒
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(interval);
            setGameStarted(true);
            resetGame();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
  };

  // 如果游戏未开始，显示开始界面
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-black">贪吃蛇游戏</h1>
        <div className="mb-4">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="请输入你的名字"
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
        <button
          onClick={startGame}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!playerName.trim()}
        >
          开始游戏
        </button>
        {countdown !== null && (
          <div className="mt-4 text-4xl font-bold text-black">{countdown}</div>
        )}
      </div>
    );
  }

  // 游戏进行中，显示游戏界面
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 text-black">贪吃蛇游戏</h1>
      <div className="mb-4">
        <span className="text-xl text-black">玩家: {playerName}</span>
        <span className="text-xl text-black ml-4">得分: {score}</span>
      </div>
      <div 
        className="relative border-2 border-gray-800 bg-white"
        style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-600"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
            }}
          />
        ))}
        <div
          className="absolute bg-red-600 rounded-full"
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
          }}
        />
      </div>
      {gameOver && (
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold mb-2 text-black">游戏结束！</p>
          <p className="text-xl mb-4 text-black">{playerName}的得分: {score}</p>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            再玩一次
          </button>
          <button
            onClick={() => setGameStarted(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            更改玩家
          </button>
        </div>
      )}
      <div className="mt-4 text-black">
        <p>使用方向键控制蛇移动</p>
      </div>
    </div>
  );
}