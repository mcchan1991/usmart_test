const app = angular.module('app', []);

app.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('<%');
    $interpolateProvider.endSymbol('%>');
}]);

app.controller('mainCtrl', function($scope, $http, $interval) {
    let get_txs =function(){
        $http({
            method: 'GET',
            url: '/api/tx'
        }).then(function successCallback(response) {
            let data=response.data;
            let txs=data.hits.map((hit) =>{
                let input_value=hit._source.inputs.reduce(( total,input) => {
                    return total+input.prev_out.value;
                },0);
                let output_value=hit._source.out.reduce(( total,output) => {
                    return total+output.value;
                },0);
                let time =(Date.now()/1000)-hit._source.time;
                return {...hit, input_value:input_value, output_value:output_value, age:time};
            });
            $scope.txs=txs;
        }, function errorCallback(response) {
            console.log(response);
        });
    }

    let get_blocks=function(){
        $http({
            method: 'GET',
            url: '/api/block'
        }).then(function successCallback(response) {
            let data=response.data;

            let blocks=data.hits.map((hit) =>{

                let time =(Date.now()/1000)-hit._source.time;

                return {...hit, age:time};
            });
            $scope.blocks=blocks;
        }, function errorCallback(response) {
            console.log(response);
        });
    }

    get_txs();
    get_blocks();
    //refresh get transaction every 10 seconds
    $interval(get_txs, 10000);
    //refresh get_bocks every 2 mins
    $interval(get_blocks, 120000)

    //search transaction via api
    $scope.searchTx=function(){
    $http({
        method: 'GET',
        url: '/api/search/'+$scope.search
    }).then(function successCallback(response) {
        let data=response.data;
        let searchResult=data.hits.map((hit) =>{
            let input_value=hit._source.inputs.reduce(( total,input) => {
                return total+input.prev_out.value;
            },0);
            let output_value=hit._source.out.reduce(( total,output) => {
                return total+output.value;
            },0);
            let time =(Date.now()/1000)-hit._source.time;

            return {...hit, input_value:input_value, output_value:output_value, age:time};
        });
        $scope.searchResult=searchResult;
        $('#searchModal').modal('show');
    }, function errorCallback(response) {
        console.log(response);
    });
    }



});

app.filter('secondsToDateTime', function() {
    return function(seconds) {
        let d = new Date(0,0,0,0,0,0,0);
        d.setSeconds(seconds);
        return d;
    };
});