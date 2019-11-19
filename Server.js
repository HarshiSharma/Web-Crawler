var cheerio = require('cheerio');
var fs = require('fs');
var axios = require('axios')
var title, rating, director, writers, stars, release_date, movie_poster_photo_url;


var startScraping = async function() {
    var resultA = await findMovies();
    var resultB = await getSingleMovie(resultA);
    var resultC = await writeData(resultB);
    return lastStep(resultC);
};


async function findMovies() {
    var movie_url = new Array()
    console.log('Scarping Started')
    let baseUrl = 'https://www.imdb.com/chart/top?ref_=nv_mv_250'
    return axios.get(baseUrl)
        .then(function(response) {

            console.log('Inital statusCode:', response.status);
            var siteHTML = response.data;
            var $ = cheerio.load(siteHTML.toString());

            $('.titleColumn').each(function(i, elem) {
                const t_title = $(elem).find('a')
                    //console.log(title.text())
                    //title = t_title.text()
                movie_url.push("https://www.imdb.com" + t_title.attr('href'))
            })
            return movie_url

        })
        .catch(err => console.log(err))


}
async function getSingleMovie(movie_url) {
    console.log('Running')
    var obj = {
        table: []
    };

    for (const elem of movie_url) {
        let x = await (movie_loop(elem))
    }

    function movie_loop(element) {

        return axios.get(element)
            .then(function(res) {
                var json = {
                    title: '',
                    rating: '',
                    director: '',
                    writers: '',
                    stars: '',
                    release_date: '',
                    movie_poster_photo_url: ''
                }
                var siteHTML = res.data;
                var $ = cheerio.load(siteHTML.toString());
                const $title = $('.title_wrapper h1');
                const $release_year = $('.titleBar .title_wrapper .subtext').children().last()
                json.release_date = $release_year.text()
                json.title = $title.first().contents().filter(function() {
                    return this.type === 'text';
                }).text().trim();
                $('.poster').each(function(i, elem) {
                    const $thisText = $(elem)
                    json.movie_poster_photo_url = $thisText.find('img').attr('src')
                        //console.log(movie_poster_photo_url)
                })

                var list = []

                $('.credit_summary_item').each(function(i, elem) {
                        const $thisText = $(elem)
                        const subCat = [];
                        const regex = new RegExp('^((?!(more credit|See full cast & crew)).)*$', 'g');
                        $thisText.find('a').each(function(i, elem) {
                            if ($(this).text().match(regex))
                                subCat[i] = $(this).text();
                        });

                        subCat.join(', ');
                        list.push(subCat.toString())
                    })
                    //console.log(list)
                json.director = list[0]
                json.writers = list[1]
                json.stars = list[2]
                json.rating = $('span[itemProp="ratingValue"]').text();

                //console.log(json)
                obj.table.push(json)
                    //console.log(obj)
            })
            .catch(err => console.log(err))

    }
    return obj
}

function writeData(obj) {
    console.log('Final Point')
        //console.log(obj)
    var json = JSON.stringify(obj);
    fs.writeFile('movie.json', json, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

function lastStep(text) {
    return text
}
console.log(startScraping());