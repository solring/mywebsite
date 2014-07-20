
$('document').ready(function(){

    var $mythumb = $('.mythumbnail');
    var $titles = $mythumb.find('h2');

    $titles.each(function(){
        $(this).data('origBottom', $(this).css('bottom'));
        console.log("in ready: origBottom=" + $(this).data('origBottom'));
    });

    $mythumb.click(function(){
        var body = $('.modal-body');
        body.empty();

        var title = $(this).parent('div').find('h2').html();
        $('.modal-title').html(title);

        var $pid = $(this).attr('id');
        console.log("pid: "+$pid);
        $.getJSON('/'+$pid+'.json', function(data){
 
            tools = data['tools'];
            pics = data['pictures'];

            tmp = "";
            for(var i=0; i<tools.length; i++){
                tmp += "<span class=\"label label-default\">"+tools[i]+"</span> ";
            }
            $('#toollist').empty().append(tmp);
            
            body.append('<p>'+data['description']+'</p>');
            for(var i=0; i<pics.length; i++){
                body.append("<img src=\""+pics[i]+"\" class=\"img-responsive\">");
            }
        });

        $('#myModal').modal('show');
    });

    $mythumb.hover( 
    function(){
        $(this).find('h2').stop().animate({
            bottom: "0"
        });
    },
    function(){
        $title = $(this).find('h2');
        $title.stop().animate({
            bottom: $title.data('origBottom')
        });
    });
});

