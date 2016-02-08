// ==UserScript==
// @name          TorrentZ [load IMDB info] - by hossam6236
// @namespace     
// @version       1.00
// @description   Userscript (for Tampermonkey or Greasemonkey) for that show ALL movie/series info from IMDB on TorrentZ domains (title, rating, poster, ...)
// @author        hossam6236
// @license       GNU General Public License v3.0
// @include       https://torrentz.eu/*
// @include       https://www.torrentz.eu/*
// @include       https://torrentz.ph/*
// @include       https://www.torrentz.ph/*
// @include       https://torrentz.li/*
// @include       https://www.torrentz.li/*
// @include       https://torrentz.com/*
// @include       https://www.torrentz.com/*
// @include       https://torrentz.me/*
// @include       https://www.torrentz.me/*
// @include       https://torrentz.in/*
// @include       https://www.torrentz.in/*
// @include       https://torrentz.hk/*
// @include       https://www.torrentz.hk/*
// @include       https://torrentz.ch/*
// @include       https://www.torrentz.ch/*
// @include       https://torrents.de/*
// @include       https://www.torrents.de/*
// @include       https://tz.ai/*
// @include       https://www.tz.ai/*
// @include       https://torrentz-proxy.com/*
// @include       https://www.torrentz-proxy.com/*
// @include       https://bestdownload.eu/*
// @include       https://www.bestdownload.eu/*
// @include       https://torrentsmirror.com/*
// @include       https://www.torrentsmirror.com/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @grant          GM_xmlhttpRequest
// ==/UserScript==

// regext for cleaning the titles
var reM = /\d{4}/;
var reS = /S\d{2}E\d{2}|\d{1}x\d{2}/;

movie_db = {};
try {

    var c = localStorage.getItem('movie_db');
    if (c) {
        $.extend(movie_db, JSON.parse(c));
    }

    var start_button = $('<button style="position: absolute; left: 500px; padding:10px;">  load info from IMDB  </button>'); //Equivalent: $(document.createElement('img'))\
    start_button.prependTo('body');
    var count = 0;
    var scroll = 0
    $(window).scroll(function (event) {
        scroll = $(window).scrollTop();
    });

    var updateElement_dl = function(title, dl_element){
        var el_title = movie_db[title].imdbVotes + ' votes - ' +  movie_db[title].Runtime + ' - Rated ' + movie_db[title].Rated + ' - Awards: ' +  movie_db[title].Awards
        var star = '';
        if(movie_db[title].Awards.toLowerCase().indexOf('won') > -1 || movie_db[title].Awards.toLowerCase().indexOf('win') > -1){
            var star = '&#9733;';
        }else if(movie_db[title].Awards.toLowerCase().indexOf('nominated') > -1 || movie_db[title].Awards.toLowerCase().indexOf('nomination') > -1){
            var star = '&#9734;';
        }
        var el = '<a href="http://www.imdb.com/title/' + movie_db[title].imdbID + '" target="_blank" title="' + el_title + '">' + movie_db[title].imdbRating + star + '</a>';
        $('a', dl_element).attr('title', movie_db[title].Title + ' (' +  movie_db[title].Year + ') - ' +  movie_db[title].Plot);
        $('a', dl_element).after(' <b style="font-size:80%;">('+movie_db[title].Genre + ')</b>');
        $('a', dl_element).on('mouseover', function(e){
            //poster_img.find('img').attr('src', "");
            poster_img.find('img').attr('src', movie_db[title].Poster);
            poster_img.find('#imdb_a').attr('href', 'http://www.imdb.com/title/' + movie_db[title].imdbID + '');
            poster_img.find('#imdb_a').attr('title', movie_db[title].Title + ' (' + movie_db[title].Year + ')');
            poster_img.find('#imdb_title').text(movie_db[title].Title)
            poster_img.find('#imdb_year').text(movie_db[title].Year)
            poster_img.find('#imdb_rating').text(movie_db[title].imdbRating)
            poster_img.find('#imdb_votes').text(movie_db[title].imdbVotes)
            poster_img.find('#imdb_rated').text(movie_db[title].Rated)
            poster_img.find('#imdb_runtime').text(movie_db[title].Runtime)
            poster_img.find('#imdb_awards').text(movie_db[title].Awards)
            poster_img.find('#imdb_genre').text(movie_db[title].Genre)
            poster_img.find('#imdb_actors').text(movie_db[title].Actors)
            poster_img.find('#imdb_director').text(movie_db[title].Director)
            poster_img.find('#imdb_writer').text(movie_db[title].Writer)
            poster_img.find('#imdb_plot').text(movie_db[title].Plot)
            poster_img.css({
                left:  $(window).width()*2/3 - poster_img.width()/2, //e.pageX + 100,
                top:   scroll + $(window).height()/2 - poster_img.height()/2
            });
            //poster_img.attr('title','Actors: ' + movie_db[title].Actors + ' - Director: ' + movie_db[title].Director) 
            poster_img.show();
        });
        $('a', dl_element).on('mouseout', function(e){
            poster_img.hide();
        });
        //$('b', this).attr('style','font-size:65%;')

        var rating = parseFloat(movie_db[title].imdbRating);//alert(rating);
        var votes = parseFloat(movie_db[title].imdbVotes.replace(',',''));
        if (rating > 7.5) { el = '<b>'+el+'</b>'; }
        $('dt', dl_element).prepend(el+ ' ');
        if(rating <= 5.0 || votes <= 1000){
            $('dt', dl_element).css({opacity: (rating/10 + votes/1000/2)/2});
        }
        if(movie_db[title].imdbRating == "N/A" || movie_db[title].imdbVotes == "N/A"){
            $('dt', dl_element).css({opacity: 0.15});
            //alert(votes);
        }
    };
    
    var getImdbInfo = function(title, year, dl_element) {
        if (title in movie_db) {
            if(movie_db[title]!==false){
                updateElement_dl(title, dl_element);
                return true;
            }
        }else{
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'http://www.omdbapi.com/?t=' + encodeURIComponent(title) + '&y=' + encodeURIComponent(title) + '&plot=full&r=json',
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    if (data.Response === 'False') {
                        movie_db[title] = false;
                        count++;
                    } else {
                        movie_db[title] = data;
                        updateElement_dl(title, dl_element);
                    }
                    //alert(title);
                    localStorage.setItem('movie_db', JSON.stringify(movie_db));
                },
                onerror: function(){
                    console.warn('request failed: http://www.omdbapi.com/?t=' + title);
                }
            });
            //updateElement_dl(title, dl_element);
            return false;
        }
    };
    
    $(document).ready(function() {});
    start_button.click(function() {
        poster_img = $('<table style="position: absolute; width:450px; height:283px; background-color:white; border:2px solid black; border-collapse: collapse; border-spacing:0px; cell-spacing:0px;"><tr>\
<td><a href="" target="_blank" title="" id="imdb_a" style="display:flex;"><img width="200" height="283" border="0"></a></td>\
<td style="border:1px solid black;"><div style="text-align:left; padding:3px; font-size:10pt; font-family:Tahoma; height:100%; overflow:auto;">\
  <div style="text-align:center; font-size:125%pt; font-weight:bold;"><span id="imdb_title">The Martian</span> (<span id="imdb_year">2015</span>)</div>\
  <u>Rating</u>: <span id="imdb_rating">8.1</span> - <span id="imdb_votes">275,300</span> votes\
  <br /><u>Genre</u>: <span id="imdb_genre">Adventure, Comedy, Drama</span>\
  <br /><u>Rated</u>: <span id="imdb_rated">PG-13</span>\
  <br /><u>Runtime</u>: <span id="imdb_runtime">144 min</span>\
  <br /><u>Awards</u>: <span id="imdb_awards"></span>\
  <br /><u>Country</u>: <span id="country">USA, UK</span>\
  <br /><u>Actors</u>: <span id="imdb_actors">Matt Damon, Jessica Chastain, Kristen Wiig, Jeff Daniels</span>\
  <br /><u>Director</u>: <span id="imdb_director">Ridley Scott</span>\
  <br /><u>Writer</u>: <span id="imdb_writer">Drew Goddard (screenplay), Andy Weir (book)</span>\
  <br /><u>Plot</u>: <span id="imdb_plot">During a manned mission to Mars, Astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew. But Watney has survived and finds himself stranded and alone on the hostile planet. With only meager supplies, he must draw upon his ingenuity, wit and spirit to subsist and find a way to signal to Earth that he is alive.</span>\
 </div></td>\
</tr></table>'); //Equivalent: $(document.createElement('img'))\
        poster_img.on('mouseover', function(e){ poster_img.show() });
        poster_img.on('mouseout', function(e){ poster_img.hide() });
        poster_img.hide();
        poster_img.appendTo('body');
        $('dl').each(function() {
            var title = $('a', this).text();
            var year = '';
            match = reM.exec(title);
            if(match >= 1900){
                year = match;
                title = title.substr(0, title.search(reM));
            }else{
                match = reS.exec(title);
                if(match){
                    year = '-';
                    title = title.substr(0, title.search(reS));
                }
            }

            //alert(title);
            if (match){
                if(match.length && count < 40) { // count increased by ajax call failures
                    getImdbInfo(title, year, this); // calls "updateElement_dl" from inside
                } else if (match.length) {
                    title = title.substr(0, title.search(re));
                    var nel = '<a href="http://www.imdb.com/find?ref_=nv_sr_fn&q=' + title + '&s=all" target="_blank">??</a>';
                    $('dt', this).prepend(nel+ ' ');
                }
            }
        });
    });

} catch (e) {
    unsafeWindow.console.log(e);
}

