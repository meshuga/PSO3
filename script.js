/**
 * Created with JetBrains RubyMine.
 * User: komp
 * Date: 20.10.12
 * Time: 11:47
 */

var map, chart;

function clear() {
    map.clearOverlays();
    map.selectedPath = null;
    var trasaLine = new GPolyline(map.mapPoints, "#FF3366", 6, 0.7);
    map.addOverlay(trasaLine);
}

function loadXML(file){
    var request = GXmlHttp.create();
    request.open("GET", file, true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            var xmlDoc = GXml.parse(request.responseText);
            var rootNode = xmlDoc.documentElement;
            var xmlNodes = rootNode.getElementsByTagName('trkpt');

            map.mapPoints = new Array(xmlNodes.length);
            for(var i=0; i < xmlNodes.length; i++) {
                var time = xmlNodes[i].getElementsByTagName('time')[0].firstChild.nodeValue;
                var ele = xmlNodes[i].getElementsByTagName('ele')[0].firstChild.nodeValue;
                var lat = xmlNodes[i].getAttribute('lat');
                var lon = xmlNodes[i].getAttribute('lon');

                var point = new GLatLng(lat,lon);
                point.time = time;
                point.ele = ele;
                map.mapPoints[i] = point;
            }

            map.setCenter(new GLatLng(lat, lon), 12);
            clear();
            map.addOverlay(new GMarker(map.mapPoints[0]));
            map.addOverlay(new GMarker(map.mapPoints[map.mapPoints.length-1]));
            setPoints(0, map.mapPoints.length-2);
        }
    }
    request.send(null);
}

function getNearestPoint(point) {
    var minimum_index = 0;
    var minimum_distance = Number.MAX_VALUE;

    for (var i=0; i<map.mapPoints.length; i++) {
        var length = distance(point, map.mapPoints[i]);
        if(length < minimum_distance){
            minimum_distance = length;
            minimum_index = i;
        }
    }
    return minimum_index;
}

function distance(point1, point2) {
    var R = 6371; // km
    var d = Math.acos(Math.sin(point1.lat())*Math.sin(point2.lat()) +
        Math.cos(point1.lat())*Math.cos(point2.lat()) *
            Math.cos(point2.lng()-point1.lng())) * R;
    return d;
}

function round(number, length) {
    return Math.round(number*Math.pow(10,length))/Math.pow(10,length);
}

function setPoints(point1, point2){
    var selectedArray = map.mapPoints.slice(point1, point2+1);
    map.selectedPath = new GPolyline(selectedArray, "#33CCFF", 7, 0.8);
    map.addOverlay(map.selectedPath);

    var eleArray = new Array()
    eleArray.push(['','']);
    for(var i=0; i < selectedArray.length; i++) {
        eleArray.push(['',parseFloat(selectedArray[i].ele)]);
    }

    var chartData = google.visualization.arrayToDataTable(eleArray);
    chart.draw(chartData, {legend: {position: 'none'}});

    var time = (new Date(map.mapPoints[point2].time) - new Date(map.mapPoints[point1].time)) / 60000.0;
    var speed = (map.selectedPath.getLength()/1000.0)/ (time/60.0);
    document.getElementById("odleglosc").innerHTML = round(map.selectedPath.getLength() / 1000, 3);
    document.getElementById("czas").innerHTML = round(time, 3);
    document.getElementById("predkosc").innerHTML = (isNaN(speed) ? 0 : round(speed, 3));
}

function mapsLoaded(){
    map = new GMap2(document.getElementById("map"));
    map.selectedPoints = new Array(2);
    map.selectedPath = null;
    map.pointCount = 0;
    loadXML('barniewice.xml');

    GEvent.addListener(map, "click", function(overlay, point) {
        if (point) {
            if(map.selectedPath){
                clear();
            }

            var pickedPoint = getNearestPoint(point);
            map.selectedPoints[map.pointCount] = pickedPoint;
            map.pointCount = (map.pointCount + 1) % 2;
            map.addOverlay(new GMarker(map.mapPoints[pickedPoint]));

            if (!map.pointCount) {
                var lo = (map.selectedPoints[0] < map.selectedPoints[1]) ? map.selectedPoints[0] : map.selectedPoints[1];
                var hi = (map.selectedPoints[1] > map.selectedPoints[0]) ? map.selectedPoints[1] : map.selectedPoints[0];
                setPoints(lo, hi);
            }
        }
    });
}

function chartsLoaded(){
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
}

function init() {
    google.load("maps", "2", {"callback" : mapsLoaded});
    google.load('visualization', '1.0', {'packages':['corechart'], "callback" : chartsLoaded});
}
