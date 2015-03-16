


module.exports = function(events) {
    
    events.on('gloveModel', function(gm) {
        console.log('got the model');
    });
    events.on('testEmit', function(gm) {
        console.log('got the test emit');
    });

}
