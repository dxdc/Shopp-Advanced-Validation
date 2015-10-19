jQuery(document).ready(function($) {
    // Shopp auto-update
    $("#shopp div.qty-cart input").bind('change', function() {
        $("input#update-shopping").click();
    });

    // Add tooltip
    $(".xcheckout img").on({
        mouseenter: function() {
            // Hover over code
            var title = $(this).attr('title');
            $(this).data('tipText', title).removeAttr('title');
            $('<p class="tooltip"></p>')
                .html(title.replace(". ", ".<br />"))
                .appendTo('body')
                .fadeIn('slow');
        },
        mouseleave: function() {
            // Hover out code
            $(this).attr('title', $(this).data('tipText').replace(".<br />", ". "));
            $('.tooltip').remove();
        },
        mousemove: function(e) {
            var mousex = e.pageX + 20; //Get X coordinates
            var mousey = e.pageY + 10; //Get Y coordinates
            $('.tooltip').css({
                top: mousey,
                left: mousex
            });
        }
    });

});