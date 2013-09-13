(function($, undefined) {
"use strict";
  var $ldtext = $('<div class="loading-text alert alert-info"><i class="icon-spinner icon-spin icon-large"></i> Loading ...</div>');

  var resize_search_panel = function() {

    var $rc = $('#result-container');
    $('#search-content').height('420px');
    $rc.slimScroll({height: "auto"});
  }

  $(window).resize(function(e) {
    resize_search_panel();
  });

  $('document').ready(function() {
    var
      search_term = "",
      loading = false,
      searching,
      query_cache = {},
      $sf = $('#search-form'),

      perform_search = function($form) {
        clearTimeout(searching); // Clear searching timeout

        loading = true;
        var $ss = $('#search-submit');
        $ss.attr('disabled', true);

        var $term_input = $sf.find('input[name="term"]').val(search_term);
        $.ajax({
          type: "POST",
          url: $form.attr('action'),
          data: $form.serialize(),
          dataType: 'json',
          success: function(data) {
            $('.loading-text').remove();
            for (var i = 0; i < data.length; i++) {
              $('#result-container').append(
                $('#search-result-tmpl').tmpl(data[i]));
            }
            $('.search-id').click(function() {
              window.result_activated($(this).data('id'));
            })

            var $offset = $sf.find('input[name="offset"]');
            $offset.val(parseInt($offset.val()) + data.length);
            loading = false;
            $ss.attr('disabled', false);
          }
        });
      };

    $('#result-container').scroll(function(e) {
      var $target = $(e.target);
      if ($target.prop('offsetHeight') + $target.prop('scrollTop') >=
        $target.prop('scrollHeight') && !loading) {
          $target.append($ldtext);
          perform_search($sf);
      }
    });

    $('.lifter').click(function() {
      $('#search-panel').toggle('slide', {direction: 'left'}, 300,
        function() {
          var $lc = $('#lift-close');
          if (!$lc.is(':visible')) {
            $lc.css("display", "block");
          } else {
            $lc.css("display", "none");
          }
      });
    });

    $sf.submit(function(e) {
      e.preventDefault();

      $('#result-container').empty().append($ldtext);

      var $form = $(this);
      $form.find('input[name="offset"]').val('0');
      search_term = $form.find('input[name="term"]').val();

      perform_search($form);
    });

    $sf.find('input[name="term"]').typeahead({
      source: function(query, process) {
        var type = $sf.find('input[name="type"]:checked').val();
        if (!(type in query_cache)) {
          query_cache[type] = {};
        }
        if (query_cache[type][query]){
          return query_cache[type][query];
        }

        if (typeof searching != "undefined") {
          clearTimeout(searching);
          searching = undefined;
        }

        searching = setTimeout(function() {
          $.getJSON('/autocomplete/' + type + '/' + query, function(data) {
            query_cache[type][query] = data;
            process(data);
          });
        }, 300);
      }
    });
    
    // Resize search panel
    resize_search_panel();
  });
}(jQuery));
