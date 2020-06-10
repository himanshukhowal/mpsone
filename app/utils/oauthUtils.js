module.exports = {
    isValidRequest: function(req){
        console.log('Checking if request have adequate parameters');
        console.log(req.query);
        var response = {
            status: 200,
            message: []
        };

        if(!req.query.redirectUrl)
        {
            response.status = 401;
            response.message.push('The redirect url is not provided');
        }
        if(!req.query.clientId)
        {
            response.status = 401;
            response.message.push('The Client ID is not provided');
        }
        return response;
    }
};