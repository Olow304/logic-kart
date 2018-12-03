$(function(){
    $('a.confirmedDeletion').on('click', function(e){
        if(!confirm('Confirm deletion'))
            return false
    })

    if($("[data-fancybox]").length){
        $("[data-fancybox]").fancybox()
    }
})