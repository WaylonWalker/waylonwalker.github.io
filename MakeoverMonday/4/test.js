// By default, geographic data is loaded asynchronously from
// the topojson subdirectory located at the root of the plotlyjs directory.
//
// To remove this asynchronous step, include:
// 
// after 'plotly.min.js'.
// Note that this bundle is quite large.
// Serving it from a network is not recommended.
//
// If you choose to rename or move the topojson subdirectory, include
// 
// after 'plotly.min.js'

var data = [{
    type: 'scattergeo',
    mode: 'markers+text',
    // text: [
    //     'Montreal', 'Toronto', 'Vancouver', 'Calgary', 'Edmonton',
    //     'Ottawa', 'Halifax', 'Victoria', 'Winnepeg', 'Regina'
    // ],
    // lon: [-73.57, -79.24, -123.06, -114.1, -113.28, -75.43, -63.57, -123.21, -97.13, -104.6],
    // lat: [
    //     45.5, 43.4, 49.13, 51.1, 53.34, 45.24,
    //     44.64, 48.25, 49.89, 50.45
    // ],
//    text: ['Argentina', 'Butterball', 'Disney', 'Domingo', 'Irma', 'La Pampa', 'Leo', 'Mac', 'Mark', 'Mary', 'Morongo', 'Prado', 'Rosalie', 'Sarkis', 'Schaumboch', 'Steamhouse 1', 'Steamhouse 2', 'Whitey', 'Young Luro', 'Argentina', 'Butterball', 'Disney', 'Domingo', 'Irma', 'La Pampa', 'Leo', 'Mac', 'Mark', 'Mary', 'Morongo', 'Prado', 'Rosalie', 'Sarkis', 'Schaumboch', 'Steamhouse 1', 'Steamhouse 2', 'Whitey', 'Young Luro'],
//        lat: [-12.67224538761358, 41.1098975733855, 38.73029146356476, -13.955668205128182, 40.62749423410069, -13.49485956140352, 53.48329316262028, 52.113723672830275, 41.03382701505764, 40.80211009564289, 42.82153578467849, 33.78654045581642, 46.27135181221797, 35.47937522855347, 41.1098975733855, 52.243924127531415, 51.97510191570892, -17.803123134328416, -17.183219607843064, -36.90399079497905, 29.55651936784733, 30.9684341854444, -36.91921258741258, 40.32837065863454, -38.117797513812214, 7.397708486827501, 8.628765257259252, 39.502290036900355, 40.22404831730772, 18.06100033120767, 33.79372145551589, 25.579834647095357, 26.866903115905576, 29.55651936784733, 9.5418968068536, 9.718197037630144, -37.53478861538455, -37.74715757719723],
//        lon: [-62.85686994369885, -74.20781106653617, -79.37471374507955, -63.929214139194436, -75.19328633953101, -49.20662122807026, -107.41256377078483, -105.72139086806632, -75.87718582816599, -76.29993342189124, -123.08728203332919, -117.7121459900327, -123.42973852525161, -120.28371713838524, -74.20781106653617, -107.15063610512739, -106.97906680350235, -62.387072761193885, -62.351308541043416, -64.24235927475614, -80.16145986376003, -81.94940991321566, -64.24171020979006, -74.98503510843352, -64.78710276243102, -69.88696033888777, -73.02000466123242, -76.98775350553497, -76.51803966346152, -96.38337796338128, -117.74214130605381, -107.22000761867629, -109.1031183843454, -80.16145986376003, -68.85513372274129, -63.992532826260934, -63.718729230769206, -63.46079781472711],
    text: ['summer2007', 'summer2008', 'summer2009', 'summer2010', 'summer2011', 'winter2007', 'winter2008', 'winter2009', 'winter2010', 'winter2011', 'winter2012', 'winter2013'],
        lat: [50.21792802631576, 53.40251302587148, 53.584585048482914, 53.563087518650605, 53.559065409428825, 7.663595228951271, 7.438724508440997, 7.3661026287263365, 7.366611236730386, 7.332306798652062, 7.372437500000027, 7.329697032181196],
        lon: [-104.81969473684204, -107.30483334645614, -107.5463818110721, -107.45146995134557, -107.49389714640203, -69.85901579025106, -69.9223872989076, -69.88117311653161, -69.88387907643411, -69.87018379949497, -69.89399032110077, -69.86419486293241],
    marker: {
        size: 10,
        color: [
            '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA',
            '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA',
            '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA', '#14B4EA',
        ],
        line: {
            width: 1
        }
    },
    name: '',
    textposition: [
        'top right', 'top left', 'top center', 'bottom right', 'top right',
        'top left', 'bottom right', 'bottom left', 'top right', 'top right'
    ],
}];

var layout = {
    title: '',
    font: {
        family: 'Droid Serif, serif',
        size: 6
    },
    titlefont: {
        // size: 16
    },
    geo: {
        // scope: 'north america',
        resolution: 50,
        lonaxis: {
            'range': [-130, -30]
        },
        lataxis: {
            'range': [0, 70]
        },
        showrivers: false,
        rivercolor: '#fff',
        showlakes: false,
        lakecolor: '#fff',
        showland: true,
        landcolor: '#DADCD5',
        countrycolor: '#d3d3d3',
        countrywidth: 1.5,
        subunitcolor: '#d3d3d3'
    }
};

Plotly.newPlot('tester', data, layout);


