jsfw.ready(function()
{
	game = new Game('pole');
	
	game.addEvent('onchangescore',function(score){
		$('score').innerHTML = score;
	});
	game.addEvent('onstart',function(score){
		$('gameover').style.display = 'none';
	});
	game.addEvent('ongameover',function(score){
		$('gameover').style.display = '';
	});
	game.start();
});