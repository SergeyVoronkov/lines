/**
*	Игра "Цветные линии" version 1.2
*	Основной класс игры
*/
var Game = jsfw.Class(function(){
/**
	здесь будут приватные методы
*/
function setScore(score)
{
	this.score = score;
	this.callEvent('onchangescore',[this.score]); // Бросим событие  об изменение счета
}
return {
	width:12,		// Ширина поля
	height:12,		// Высота поля
	speed:30,		// Скорость перемещения шарика
	minline:5,		// Минимальное количество шаров  для удаления
	countNewBall:3,	// Количество добавляемых шаров 
	costBall:1,		// стоимость шара
	costBonus:5,	// стоимость бонуса
	/**
	* Конструктор
	* @param ID элимента для отрисовки игрового поля
	*/
	__constructor:function(el) 
	{
		this.dom = $(el);	// Сохраним контейнер
		this.score = 0;		// Обнулим количество балов
		this.cell = [];		// Сдесь будут хранится ячейки игравого поля
		/*
			Функция $d создает функцию каторая запускает переданную функцию в контексте объекта переданного первым аргументом
		*/
		this.dSelectBall = $d(this,this.selectBall); // Создадим делегатов для событии щелчка по ячейки и шарику
		this.dSelectCell = $d(this,this.selectCell);
		this.countCell = this.width*this.height;	// Для ускарения расчетов подщитаем количество ячеек
	},
	/**
	* Начало новой игры
	*/
	start:function()
	{
		setScore.call(this,0); // обнулим счет
		this.createCell(); // Создадим новое поле
		this.newBall();
		this.callEvent('onstart'); // Кинем собитие начала игры
	},
	/**
	* Конец игры
	*/
	gameOver:function()
	{
		// Сдесь просто кинем событие об окончание игры
		this.callEvent('ongameover');
	},
		/**
	* Создание нового игравого поля
	*/
	createCell:function()
	{
		$.empty(this.dom); // Отчистим DOM 
		var p = $.create('div',{className:'Pole'}); // Создадим контейнер поля
		// Переберем все поле
		for(var y=0,lenY=this.height;y<lenY;y++)
			for(var x=0,lenX=this.width;x<lenX;x++)
			{
				var cell = new Cell(x,y); // Создадим ячеку 
				cell.addEvent('onclick',this.dSelectCell); // Подпишемся на событие щелчка по ячейки, используя делегата ранее созданного
				p.appendChild(cell.getDom());		// Получим DOM у ячейки и добавим его в наш контейнер
				this.cell[this.getIndex(x,y)] = cell; // Сохраним ячейку в массиве, используя функцию нахождения индекса по координатам
			}
			this.dom.appendChild(p); // Добавим контейнер в DOM игры
		$.create('div',{style:{clear:'left'}},this.dom);
	},
	/**
	* Функция выбора ячейки
	*/
	selectCell:function(cell)
	{
		if(!cell.isBall() && this.seletedBall) // Если в ячейке нет шарика и есть выделенный
		{
			// Найти путь
			var track = this.searchTreck(this.seletedBall.cell.x,this.seletedBall.cell.y,cell.x,cell.y);
			if(track) 
			{
				this.startMoveAnime(track); // Начать перемещение
			}
			else
			{
				// если путь не нашли то сообщим об этом
				alert("Ход не возможен");
			}
		}
		return false;
	},
	/**
	* Получение индекса массива по координатам поля
	* @param Координата по оси X
	* @param Координата по оси Y
	*/
	getIndex:function(x,y)
	{
		return (x >= 0 && x < this.width && y>=0 && y<this.height)?x*this.width+y:-1;
	},
	/**
	* Добавляет шарик в свободное поле
	*/
	addRandBall:function(ball)
	{
		/*
			в масиве this.emptyCell хранятся индексы свободных ячеек
		*/
		var i = Math.rand(0,this.emptyCell.length-1); // Выберем случайно индекс свободной ячейки
		this.cell[this.emptyCell[i]].addBall(ball); //  И добавим в нее  шарик
		this.emptyCell.splice(i,1); // Удалим из массива эту ячейку, т.к. мы ее заняли
	},
	/**
	*	Помещает на игровое поле новые шарики
	*/
	newBall:function(){
		this.emptyCell = []; // Обнулим массив свободных шариков, и заполним его заново, он мог изменится
		var lines = []; // Массив собранных линий
		for(var i=this.cell.length;i--;)
		{
			if(!this.cell[i].isBall()) this.emptyCell.push(i); // Если ячейка пустая добавим в массив
		}
		/*
			Создадим новые шарики количеством указанным в переменной this.countNewBall
			Но так как свободных мест может не хватить по этому мы выберем минимальное значение
		*/
		for(var i=Math.min(this.countNewBall,this.emptyCell.length);i--;)
		{
			var ball = new Ball();
			ball.addEvent('onclick',this.dSelectBall); // Подпишемся на событие
			this.addRandBall(ball);	// Добавим шарик
			lines.concat(this.searchLines(ball)); // Найдем собранные линии и добавим их в массив линий
		}
		if(lines.length>0) // Если по чистой случайности совпали линии то удалим их
		{
			this.clearLines(lines);
		}
		// Дальше проверим если количество свободных мест меньше чем добавляемые шарики то конец игры
		else if(this.emptyCell.length<=this.countNewBall) this.gameOver();
	},
	/**
	* Выделение шарика
	*/
	selectBall:function(ball){
		if(this.seletedBall) this.seletedBall.unselect(); // Если уже был выбран шарик снимаем выделение
		this.seletedBall = ball; // Сохраняем новый шарик и выделяем его
		ball.select();
		return false;
	},
	/**
	* Поиск собранных линий
	* @param Начальный шарик
	*/
	searchLines:function(sBall)
	{
		var color = sBall.color;	// Будем считать шарики этого цвета
		var x0 = sBall.cell.x,y0 = sBall.cell.y;	// Начальные координаты
		var t = [	// Направление сканирования
			[1,0],	// вправо
			[1,1],	// верх-вправо
			[0,1],	// верх
			[1,-1]	// вниз-вправо
		];	// Все остальные направление это зеркальное отображение этих
		var lines = []; // Здесь мы будем хранить линии удовлетворяющие условиям
		// Пройдемся по всем направлениям.
		for(var i=4;i--;) 
        {
			var p = t[i], // Выберем текущее направление
				ball,		// Это у нас текущий шарик
				line=[sBall], // Создадим новую линию, и запишем туда стартовый шарик, он вед нужного цвета :)
				count=1,	// Количество шаров одного цвета в линии, пока он один
				x = x0,y = y0,	// Координаты текущего шара
				dx = p[0],dy = p[1]; // Направление движения, мы будем каждый раз изменять координаты на эти значения
			// Ну и теперь пробежимся по линиям и подсчитаем шарики одного цвета, если встретили шар другого цвета то выходим из цикла
			do
			{
				x = x+dx,y = y+dy;	// Переходим на следующий шар
				var index = this.getIndex(x,y);	// Получаем его индекс в массиве, -1 если вышел за предела поля
				// Следующей строчкой мы проверяем 
				if(index>=0)
				{
					ball = this.cell[index].getBall(); // Достаним шар из ячейки
					if(!ball || ball.color!= color) break; // Если нет шарика или цвет другой то выходим
				}
				else
				{
					break;
				}
				/*
					Предыдущии 9 строчек можно заменить на одну, но так понятнее :)
					if(index<0 || !(b = this.cell[index].getBall()) || b.color!= color) break;
				*/
				line.push(ball); // Добавим шар в линию
				count++;	// Увеличим количество шаров
			}while(count<this.minline); // это на всякий случай чтоб не за цыклилось, а если вы немного подумаете поймете почему не может быть больше шаров в одном направление
			// Половина линии мы подсчитали теперь вторая
			x = x0,y = y0,	// Вернемся в начало
			dx = -p[0],dy = -p[1],	// инвертируем направление
			count = 1	// Сбросим счетчик
			// А теперь копипаст. А почему именно копипаст? А чтобы не тратить время на вызов функции.
			do
			{
				x = x+dx,y = y+dy;	// Переходим на следующий шар
				var index = this.getIndex(x,y);	// Получаем его индекс в масиве, -1 если вышел  за предела поля
				// Следующей строчкой мы проверяем 
				if(index>=0)
				{
					ball = this.cell[index].getBall(); // Достаём  шар из ячейки
					if(!ball || ball.color!= color) break; // Если нет шарика или цвет другой то выходим
				}
				else
				{
					break;
				}
				/*
					Предыдущии 9 строчек можно заменить на одну, но так понятнее :)
					if(index<0 || !(b = this.cell[index].getBall()) || b.color!= color) break;
				*/
				line.push(ball); // Добавим шар в линию
				count++;	// Увеличим количество шаров
			}while(count<this.minline); // это на всякий случай чтоб не за циклилось, а если вы немного подумаете поймете почему не может быть больше шаров в одном направление
			if(line.length>=this.minline) lines.push(line);	// А теперь если длина линии больше или равна минимальной добавим ее в массив линий
		}
		return lines;
	},
	/**
	* Удаление линий и подсчет балов
	* @param Массив линий
	*/
	clearLines:function(lines)
	{
		var score = 0;	// Для хранения балов
		for(var i=lines.length;i--;)
		{
			var line = lines[i]; // Достаним очередную линию
			for(var j=line.length;j--;)
			{
				var ball = line[j];	// достаним шарик
				ball.remove();	// и удалим его
				score += this.costBall; // приплисуем количество  балов доваемое за шарик
			}
		}
		this.score += score*lines.length; // Увеличим количество балов на количество линий, чтобы играть было интересней. И добавим к общему счету
		this.callEvent('onchangescore',[this.score]); // Сообщим то что счет изменился
	},
	// Item3
	/**
	*	Строит карту пути
	*	@param Координата начала пути по оси X
	*	@param Координата начала пути по оси Y
	*	@param Координата конца пути по оси X
	*	@param Координата конца пути по оси Y
	*	@param Масси координат пути
	*/
	getTraceMap:function(x0,y0,x1,y1)
	{
		var tempMap = []; // Временный масив
		tempMap[this.getIndex(x0,y0)] = 1; //начало пути
		tempMap[this.getIndex(x1,y1)] = -1; //конец  пути
		var w = 1; // Волна 
		for(var i=this.cell.length;i--;) if(!this.cell[i].isBall()) this.cell[i].dom.innerHTML = ''; // для демонстрации волны
		function testCell(x,y,w) // Тестирует клетку и записывает о ней иформацию во временный массив
		{
			var i = this.getIndex(x,y);
			if(i>=0) // За пределами игравого поля клетки нас не интересуют
			{
				var c = tempMap[i];
				if(c == -1)
				{
					tempMap[i] = w+1; // мы нашли конец пути, запишим туда очередную волну и выйдем
					return true;	
				}
				if(!c && i in this.cell)	// Если клетка времменного массива пуста и есть такая ячека игравого поля
				{
					if(this.cell[i].isBall()) // В этой ячеки стаит шарик то записываем -2
						tempMap[i] = -2;
					else
					{
						tempMap[i] = w+1;	// Иначе на еденицу больше волны
					}
				}
			}
		}
		function waveItem(w)
		{
			for(var x=this.width;x--;)
			{
				for(var y=this.height;y--;)
				{
					var i = this.getIndex(x,y);
					if(i>=0 && tempMap[i] == w) // Если мы в области игравого поля и в клетке времменного массива записан номер волны 
					// тогда проверим соседнии клетки
					{
						if(testCell.call(this,x+1,y,w)
							|| testCell.call(this,x-1,y,w)
							|| testCell.call(this,x,y+1,w)
							|| testCell.call(this,x,y-1,w)) return true; // если нашли путь вернем карту пути
					}
				}
			}
		}
		while(w<1000) // Ограничем ее на всяки случай
		{
			if(waveItem.call(this,w)) return tempMap;
			w++;	// Увеличим волну на еденицу
		}
		return false;
	},
	
	/**
	*	Прокладывает путь
	*	@param Координата начала пути по оси X
	*	@param Координата начала пути по оси Y
	*	@param Координата конца пути по оси X
	*	@param Координата конца пути по оси Y
	*	@param Массив индексов ячеек пути
	*/

	searchTreck:function(x0,y0,x1,y1)
	{
		var map = this.getTraceMap(x0,y0,x1,y1); // построим карту пути
		if(map)
		{
			var x=x1,y=y1; // Начнем прокладывать путь с конца, из финиша
			var t=[[1,0],[-1,0],[0,1],[0,-1]]; // Четыре направления для просмотра соседних клеток
			var i = this.getIndex(x,y); // Получим индекс 
			var track = [i]; // Здесь мы будем хранить индексы пути и начнем с финиша
			while(map[i]!=1)	// Проходим путь пока не достигнем начала (ячейка в карте с еденичкой)
			{
				var wc = map[i];	// Номер волны в текущей ячейке
				for(var j=0;j<4;j++) // Найдем ячейку у которой номер волны меньше чем у текущей
				{
					var p = t[j]; // Направление 
					var i2 = this.getIndex(x+p[0],y+p[1]); // Получим индекс соседней клетки
					if(i2>=0) // Проверим находится ли она в зоне поля
					{
						var w = map[i2]; // номер волны соседней ячейки
						if(w>0 && w<wc) 
						// Проверим чтобы поле было свободно и номер волны меньше чем в текущей тогда переходим в эту ячеку
						{
							x = x + p[0]; // Новые координаты
							y = y + p[1];
							i = i2;	// Новый индекс
							track.push(i);	// Запомним его в пути
							break;
						}
					}
				}
			}
			return track; // Вернем путь по нему мы будем строит анимацию
		}
		return false
	},
	/**
	* Начало анимации перемещения
	* @param Массив пути
	*/
	startMoveAnime:function(track){
		var ball = this.seletedBall; // Получим выдиленный шар 
		this.seletedBall = false;	// и снимим выдиление
		ball.unselect();
		var cell = this.cell;	// Запомним массив 
		var i=track.length; // Путь мы запомнили наоборот по этому будем перемещатся с конца массива
		var _this = this;		// и this в локальную переменную чтобы использовать их в замыкание
		(function(){
			if(i--) // Пока не достигнем конца
			{
				cell[track[i]].addBall(ball); // Переместим шарик в следующюю клетку
				setTimeout(arguments.callee,_this.speed); // Повторим через некоторое время для замедления перемещения
			}
			else
				_this.stopMoveAnime(ball); // Достигли конца остановим перемещение
		})();
	},
	/**
	* Завершение перемещения шара
	*/
	stopMoveAnime:function(ball)
	{
		var lines = this.searchLines(ball); //  Найдем собранные линии
		if(lines.length>0)
		{
			this.clearLines(lines);		// И удалим их
		}
		else
		{
			this.newBall(); // Если не одна линия не была собрана то выбрасываем на поле новые шарики
		}
	}
}},
jsfw.Object // Класс реализующий  события
);

/**
*	Класс ячейки игравого поля
*/
var Cell = jsfw.Class({
	__constructor:function(x,y)
	{
// Координаты ячеки
		this.x = x;
		this.y = y;
		/*
		Функция $.create облегчает создание DOM объекта первый параметр это название тэга, второй свойства обьекта, третий родительский DOM объект
		*/
		this.dom = $.create('div',{
			className:'Cell',	// Класс ячейки
			onclick:$d(this,this.click)	// Навешаем на нее событие он клик выполняющей соответствующюю функцию в ячейки
		},this.dom);
	},
	/**
	*	Вставка шарика в ячейку
	*	@param Шарик
	*/
	addBall:function(ball)
	{
		if(ball.cell) ball.cell.ball = null; // Если в ячейки уже есть шарик то разрываем с ним связь (В принципе это не должно быть но на всякий случай лучше предусмотреть)
		this.ball = ball;	// Сохраняем шарик во внутренней переменной
		ball.cell = this;	// Указываем шарику в какой ячейки он находится
		this.dom.appendChild(ball.getDom()); // Добавляем его в DOM объект
	},
	/**
	*	Удаление шарика из ячейки
	*/
	removeBall:function()
	{
		$.remove(this.ball.getDom()); // Удаление из DOM
		this.ball.cell = null;	// Разрываем все связи с шариком
		this.ball = null;
	},
	/**
	*	Есть ли шарик в ячейки
	*/
	isBall:function()
	{
		return !!this.ball;
	},
	/**
	*	Получить шарик из ячейки
	*/
	getBall:function()
	{
		return this.ball;
	},
	/**
	*	Получить DOM ячейки
	*/
	getDom:function()
	{
		return this.dom;
	},
	/**
	*	Клик по ячейки
	*/
	click:function()
	{
		// Просто бросаем событие onclick
		return this.callEvent('onclick');
	}
},jsfw.Object);
/**
* Класс шарика
*/
var Ball = jsfw.Class({
	countColor:6,	// Количество цветов
	__constructor:function()
	{
		this.color = c = Math.rand(1,this.countColor); // Случайно с генерируем индекс цвета, цвета у нас будут прописаны в стилях как .Ball{Индекс}
		this.dom = $.create('div',{className:'Ball Ball'+this.color,onclick:$d(this,this.click)},this.dom); // Создадим DOM элемент шарика, подпишемся на событие onclick и выставим цвет
	},
	/**
	* Получение DOM шарика
	*/
	getDom:function()
	{
		return this.dom;
	},
	/**
	*	Клик по шарику
	*/
	click:function()
	{
		return this.callEvent('onclick');
	},
	/**
	*	Выделить шарик
	*/
	select:function()
	{
		// jsFW.fx.blink заставляет элемент маргать с периодом в time
		this.blink = jsFW.fx.blink(this.dom,{time:300}); // Сохраним идентификатор чтобы можно было потом мигание прекращать
	},
	/**
	*	Снять выделение
	*/
	unselect:function()
	{
		if(this.blink) // Если моргал тогда останавливаем
		{
			this.blink.stop();
			delete this.blink;
		}
	},
	/**
	* Удалить шарик с поля, и разорвать все связи с ячейкой
	*/
	remove:function()
	{
		if(this.cell)
		{
			$.remove(this.dom);
			this.cell.ball=null;
			this.cell = null;
		}
	}
},jsfw.Object);