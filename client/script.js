$(function(){
    //variables
    $('.ready').click(function(){
        var nick = $('.nickname').val();
        //blank nickname
        if(nick.trim() === ''){
            return;
        }

        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');

        $(c).attr('id', 'map').attr('width', '1400').attr('height', '1000');
        $('.main').html(c);
	$('.main').css('margin', 0);
    });
});
