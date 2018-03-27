var root = './api/'

var sel_file = document.getElementById('sel-file')
var store_name = document.getElementById('store_name')

fetch(root + 'map.json')
    .then(function (response) {
        return json = response.json()
    })
    .then(function (data) {
        for (var i = 0; i < data['json'].length; i++) {
            var opt = document.createElement('option')
            opt.innerHTML = data['json'][i].slice(0,-5)
            opt.value = data['json'][i]
            sel_file.append(opt)
        }
    })



changeData = function(event){
    fetch(root + event.target.value)
    .then(function(response) {
        return json = response.json()
    })
    .then(function(data) {
        chart.load({json: data})
        store_name.innerHTML = event.target.value.slice(0, -5)
    })
}
    
sel_file.onchange = changeData