(function($, undefined) {
  $.extend($.fn.disableTextSelect = function() {
    return this.each(function(){
      if (navigator.userAgent.match(/mozilla/i)){ //Firefox
        $(this).css('MozUserSelect', 'none');
      } else if (navigator.userAgent.match(/msie/i)){ //IE
        $(this).bind('selectstart',function(){ return false; });
      } else {//Opera, etc.
        $(this).mousedown(function() { return false; });
      }
    });
  });
}(jQuery));
