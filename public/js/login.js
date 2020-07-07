$(document).ready(function(){
    setTimeout(function(){
        let firstName = getParams('firstName');
        if(firstName)
        {
            Notiflix.Report.Success(
                'Hi, ' + firstName,
                'You are successfully authorized. Your whole data has been encrypted using a private key and will be delivered to the source requesting it.',
                'Got it!',
                {
                    width: '360px',
                    svgSize: '120px',
                }
            );
        }
    }, 500);
});

function getParams(name){
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
       return decodeURIComponent(name[1]);
 }