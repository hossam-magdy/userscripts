// ==UserScript==
// @name          IMDB info + .torrent from magnet
// @version       1.20180830
// @description   Show info of movies/series's (rating, poster, actors, ...) from IMDB on almost any torrent domain (thepiratebay, *torrent* , ...) as well as showing .torrent download links from any magnet:?url
// @namespace     hossam6236
// @author        hossam6236
// @license       GPL-3.0
// @include       http*://*torrent*.*/*
// @include       http*://*piratebay*.*/*
// @include       http*://*isohunt*.*/*
// @include       http*://*1337x*.*/*
// @include       http*://*rarbg*.*/*
// @include       http*://*zooqle*.*/*
// @include       http*://*bitsnoop*.*/*
// @include       http*://*dnoid*.*/*
// @include       http*://*torlock*.*/*
// @include       http*://*eztv*.*/*
// @include       http*://*idope*.*/*
// @include       http*://*toorgle*.*/*
// @include       http*://*demonoid*.*/*
// @include       http*://*kickass*.*/*
// @include       http*://*kat*.*/*
// @include       http*://*boxofficemojo*.*/*
// @include       http*://*subscene*.*/*
// @include       http*://*.imdb.*/*
// @require       https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @grant         GM_xmlhttpRequest
// @connect       imdb.com
// @connect       omdbapi.com
// ==/UserScript==

// Find at:
// https://greasyfork.org/en/scripts/16946-imdb-info-torrent-from-magnet
// https://openuserjs.org/scripts/hossam6236/IMDB_info_%2B_.torrent_from_magnet

function jQueryCode(){
    // IMDB.com
    if((window.location.href).indexOf('imdb.com')>-1) {
        $(document).ready(function() {
            var movieTitleElements = $('div.title_wrapper>h1[itemprop="name"] , div.title:has(>a.title-grid) , td.titleColumn:has(>a), h3.lister-item-header:has(>a) , td.overview-top>h4:has(>a)');
            movieTitleElements.each(function(){
                if(typeof $(this).find('a[downloadlink]')[0] == 'undefined') {
                    var movieTitle = $(this).text().replace(/\s+/g, " ").trim();
                    if( $(this).hasClass('titleColumn') || $(this).hasClass('lister-item-header') )
                        movieTitle = movieTitle.substr(movieTitle.indexOf(".")+1).trim();
                    var linkElement = $('<a downloadlink="1" target="_blank" title="Search for torrents">⇩</a>');
                    linkElement.attr('href', 'https://thepiratebay.org/search/'+encodeURIComponent(movieTitle)+'/0/99/0');
                    if( $(this).parent().hasClass('title_wrapper') )
                        linkElement.css('font-size', '50%');
                    linkElement.appendTo($(this));
                }
            });
        });
    }
    else
        // A torrent site
    {
        // regext for cleaning the titles
        var reM = /[0-9]{4}/i;
        var reS = /S[0-9]{2}E[0-9]{2}|[0-9]{1}x[0-9]{2}/i;
        var from_imdb = false;
        var live = false;

        $.toTitleCase = function (str) {
            return str;
        };

        const API_KEY_OMDB = 'c989d08d';
        full_magnets = {};
        movie_db = {};
        movie_loading = {};
        try {

            $.urlParam = function (name) {
                var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
                if(results)
                    return results[1];
                else
                    return 0;
            };

            var c = localStorage.getItem('movie_db');
            if (c) {
                $.extend(movie_db, JSON.parse(c));
            }

            var c = localStorage.getItem('full_magnets');
            if (c) {
                $.extend(full_magnets, JSON.parse(c));
            }

            var count = 0;
            start_button = $('<div style="width: 200px; height: 60px;display: inline-block; position: fixed; opacity: 0.75; z-index: 10000; background-color: #FFF; text-align: center;"><div style="height: 20px; margin: 0px;"><input type="checkbox" name="from_imdb" id="from_imdb" style="margin: 0px; display: inline-block;" disabled="disabled" /><label for="from_imdb" style="font:10pt Tahoma; margin: 0px; display: inline-block;">from IMDb</label> | <input type="checkbox" name="live" id="live" style="margin: 0px; display: inline-block;" /><label for="live" style="font:10pt Tahoma; margin: 0px; display: inline-block;">live</label> | <a href="javascript:location.reload();" style="color:#000; font:7pt Tahoma;" id="clear">(clear cache)</a></div><button style="display: inline-block; margin:0px; padding:7px; font:12pt Tahoma;" id="start"> load IMDb info </button></div>');
            $('body').prepend(start_button);
            start_button.css({height: start_button.parent().height()>0 ? start_button.parents('div').height() : start_button.parents('div').height()});


            var updateElement_dl = function(stor_title){
                var dl_element = '.'+stor_title;
                if (movie_db[stor_title]===false) {
                    $('a', dl_element).css('color','#777');
                    return true;
                }
                var awards_text = $('<span>'+movie_db[stor_title].Awards+'</span>').text(); //awards_text = awards_text ? awards_text : 'N/A';
                var el_title = movie_db[stor_title].imdbVotes + ' votes - ' +  movie_db[stor_title].Runtime + ' - Rated ' + $('<span>'+movie_db[stor_title].Rated+'</span>').text() + ' - Awards: ' +  awards_text;
                var star = '';
                var reg_wins = /([0-9]+) win(s|)/;
                var reg_noms = /([0-9]+) nomination(s|)/;
                var reg_wins_sig = /won ([0-9]+) /;
                var reg_noms_sig = /nominated for ([0-9]+) /;
                var wins = reg_wins.exec(awards_text.toLowerCase()); if(wins) wins = parseFloat(wins[1]);
                var noms = reg_noms.exec(awards_text.toLowerCase()); if(noms) noms = parseFloat(noms[1]);
                var wins_sig = reg_wins_sig.exec(awards_text.toLowerCase()); if(wins_sig) wins_sig = parseFloat(wins_sig[1]);
                var noms_sig = reg_noms_sig.exec(awards_text.toLowerCase()); if(noms_sig) noms_sig = parseFloat(noms_sig[1]);

                if((wins_sig >= 1 || noms_sig >= 3) && (wins >= 5 || noms >= 10)){
                    star = '<span style="color:#DD0000">&#9733;</span>';
                }else if(wins >= 10 || (noms_sig >= 1 && noms >= 5)){
                    star = '<span style="color:#660000">&#9733;</span>';
                }else if(wins >= 5 || noms >= 10 || noms_sig >= 1){
                    star = '&#9733;';
                }else if(wins + noms >= 1){
                    star = '&#9734;';
                }

                var el = '<a href="http://www.imdb.com/title/' + movie_db[stor_title].imdbID + '" target="_blank" title="' + el_title + '" style="float: left; max-width: 35px; min-width: 35px; font-size:85%; margin:0 4px 0 0;">' + movie_db[stor_title].imdbRating + star + '</a>';
                var rating = parseFloat(movie_db[stor_title].imdbRating);//alert(rating);
                var votes = parseFloat(movie_db[stor_title].imdbVotes.replace(',',''));
                if (rating >= 7.5 || votes>50000) { el = '<b>'+el+'</b>'; }

                var opac = 1.0;
                if(rating <= 5.0 || votes <= 1000) { opac = Math.max(0.15, Math.min(rating/10, votes/1000)); }
                else if(movie_db[stor_title].imdbRating == "N/A" || movie_db[stor_title].imdbVotes == "N/A"){ opac = 0.15; }

                $(dl_element).each(function(){
                    $(this).find('#loading').hide();
                    $(this).css({opacity: opac});
                    var theElement_a = $(this).find('a').first();
                    $(el+ ' ').insertBefore(theElement_a);
                    $(theElement_a).css('display', 'inline-block');
                    theElement_a.on('mouseover', function(e){
                        const posterUrl = movie_db[stor_title].Poster || 'http://ia.media-imdb.com/images/G/01/imdb/images/nopicture/large/film-184890147._CB379391879_.png';
                        poster_img.find('#imdb_poster').html(`<img src="${posterUrl}" style="width: 100%; height: 100%;">`);
                        poster_img.find('#imdb_poster').attr('href', movie_db[stor_title].PosterURL || '#');
                        poster_img.find('#imdb_a').attr('href', 'http://www.imdb.com/title/' + movie_db[stor_title].imdbID + '');
                        poster_img.find('#imdb_a').attr('title', movie_db[stor_title].Title + ' (' + movie_db[stor_title].Year + ')');
                        poster_img.find('#imdb_title').html(movie_db[stor_title].Title);
                        poster_img.find('#imdb_year').html(movie_db[stor_title].Year);
                        poster_img.find('#imdb_rating').html(movie_db[stor_title].imdbRating);
                        poster_img.find('#imdb_votes').html(movie_db[stor_title].imdbVotes);
                        poster_img.find('#imdb_metascore').html(movie_db[stor_title].Metascore);
                        poster_img.find('#imdb_boxofficegross').html(movie_db[stor_title].BoxOfficeGross);
                        poster_img.find('#imdb_rated').html(movie_db[stor_title].Rated);
                        poster_img.find('#imdb_runtime').html(movie_db[stor_title].Runtime);
                        poster_img.find('#imdb_awards').html(movie_db[stor_title].Awards.replace('Another ', '<br />Another '));
                        poster_img.find('#imdb_genre').html(movie_db[stor_title].Genre);
                        poster_img.find('#imdb_actors').html(movie_db[stor_title].Actors);
                        poster_img.find('#imdb_director').html(movie_db[stor_title].Director);
                        poster_img.find('#imdb_writer').html(movie_db[stor_title].Writer);
                        poster_img.find('#imdb_plot').html(movie_db[stor_title].Plot);
                        if (movie_db[stor_title].Trailer) {
                            poster_img.find('#imdb_trailer').show();
                            poster_img.find('#imdb_trailer').find('a').attr('href', movie_db[stor_title].Trailer);
                        } else {
                            poster_img.find('#imdb_trailer').hide();
                        }
                        poster_img.find('a[href^="/"]').each(function(){ // http://www.imdb.com
                            $(this).attr('href', 'http://www.imdb.com' + $(this).attr('href'));
                        });
                        poster_img.css({
                            left:  $(window).width()*2/3 - poster_img.width()/2, //e.clientX+20,//
                            top:   $(window).height()/2 - poster_img.height()/2 //e.clientY//
                        });
                        poster_img.stop(true, true).show();
                    });
                    theElement_a.first().on('mouseout', function(e){
                        poster_img.stop(true, true).fadeOut(2000);
                    });
                });
            };

            const getImdbInfoByID = function (imdbID, stor_title, movie_imdb) {
                var url2 = 'http://m.imdb.com/title/' + imdbID + '/';
                let dl_element = $('.'+stor_title);
                $('#loading', dl_element).text('2/2');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url2,
                    onload: function(response2) {
                        var resp2 = response2.responseText.replace(/<script([\S\s]*?)>([\S\s]*?)<\/script>/igm,'');
                        resp2 = resp2.replace(/<style([\S\s]*?)>([\S\s]*?)<\/style>/igm,'');
                        var poster_match = $(resp2).find('img.media-object[itemprop="image"][title$=" Poster"][data-src-x2]').first().parent().clone();  // alert(poster_match);
                        resp2 = $(resp2.replace(/<img[^>]*>/igm,""));//.replace('="http:', '="httpX'));
                        movie_imdb.Poster = poster_match.find('img').first().attr('data-src-x2'); //alert(movie_imdb.Poster);
                        movie_imdb.PosterURL = poster_match.attr('href');//.attr('href');
                        movie_imdb.Plot = resp2.find('p[itemprop="description"]').first().text().trim();
                        movie_imdb.Trailer = resp2.find('a[itemprop="trailer"]').attr('href');
                        movie_imdb.imdbRating = resp2.find('#ratings-bar').first().find('div').first().text() + ''; if(movie_imdb.imdbRating) movie_imdb.imdbRating = movie_imdb.imdbRating.trim();
                        movie_imdb.imdbVotes = /\/10([0-9,]+)/.exec(movie_imdb.imdbRating); movie_imdb.imdbVotes = movie_imdb.imdbVotes ? (movie_imdb.imdbVotes[1]) : ''; if(movie_imdb.imdbVotes.length===0) movie_imdb.imdbVotes = 'N/A';
                        movie_imdb.imdbRating = /([0-9.]+)\/10/.exec(movie_imdb.imdbRating); movie_imdb.imdbRating = movie_imdb.imdbRating ? (movie_imdb.imdbRating[1]) : ''; if(movie_imdb.imdbRating.length===1) movie_imdb.imdbRating = movie_imdb.imdbRating + '.0'; if(movie_imdb.imdbRating.length===0) movie_imdb.imdbRating = 'N/A';
                        movie_imdb.Rated = resp2.find('p.infobar').first().find('meta[itemprop="contentRating"]').first().attr('content');
                        movie_imdb.Rated = movie_imdb.Rated ? '<a href="http://www.imdb.com/title/'+movie_imdb.imdbID+'/parentalguide" target="_blank">'+movie_imdb.Rated.trim()+'</a>' : 'N/A';
                        movie_imdb.BoxOfficeGross =  (/\$[0-9,\-]+/.exec(resp2.find('section:contains("Box Office")').find('section:contains("Gross")').first().text()));
                        movie_imdb.BoxOfficeGross = movie_imdb.BoxOfficeGross ? movie_imdb.BoxOfficeGross[0] : '-';
                        movie_imdb.Metascore =  resp2.find('span.metascore').text(); movie_imdb.Metascore = movie_imdb.Metascore ? movie_imdb.Metascore : '-';
                        movie_imdb.Director = resp2.find('a[itemprop="director"]').first().find('[itemprop="name"]').first().text().trim();
                        var tmp_hrefDir = resp2.find('a[itemprop="director"]').first().attr('href'); //.replace('m.imdb.com', 'www.imdb.com')
                        movie_imdb.Director = tmp_hrefDir ? '<a href="'+tmp_hrefDir.replace('m.imdb.com', 'www.imdb.com')+'" target="_blank">'+movie_imdb.Director+'</a>' : movie_imdb.Director;
                        movie_imdb.Runtime = resp2.find('p.infobar').first().find('time[itemprop="duration"]').first().text() + ''; movie_imdb.Runtime = movie_imdb.Runtime ? (movie_imdb.Runtime.trim()) : '';
                        tmp = [];
                        resp2.find('p.infobar').first().find('span[itemprop="genre"]').each(function(){ tmp = $.merge(tmp, [$(this).text().trim()]); });
                        movie_imdb.Genre = tmp.join(', ').trim();
                        tmp = [];
                        resp2.find('#awards').first().find('span[itemprop="awards"]').each(function(){ tmp = $.merge(tmp, [$(this).text().trim().replace('\n', ' ').replace("\n", ' ')]); });
                        movie_imdb.Awards = tmp.join(' ').trim();
                        movie_imdb.Awards = movie_imdb.Awards ? '<a href="http://www.imdb.com/title/'+movie_imdb.imdbID+'/awards" target="_blank">'+movie_imdb.Awards.trim()+'</a>' : 'N/A';
                        tmp = [];
                        resp2.find('div#cast-and-crew').first().find('a').slice(0,4).each(function(){ if($(this).first('strong').text().trim().length>0) tmp = $.merge(tmp, ['<a href="'+$(this).attr('href').replace('m.imdb.com', 'www.imdb.com')+'" target="_blank">'+$(this).first('strong').text().trim()+'</a>']); });
                        movie_imdb.Actors = tmp.join(', ').trim();
                        //alert(JSON.stringify(movie_imdb));
                        movie_db[stor_title] = movie_imdb;
                        updateElement_dl(stor_title);
                        localStorage.setItem('movie_db', JSON.stringify(movie_db));
                    },
                    onerror: function(e2){
                        $('#loading', dl_element).text(' ⛌ ').attr('title', 'Error in retrieving data');
                        console.warn('request failed: ' + url2);
                    }
                });
            };

            var getImdbInfo = function(title, year) {
                var stor_title = classFromTitle( title + '_' + year + '_' + from_imdb );
                var dl_element = $('.'+stor_title);
                $(dl_element).each(function(){ $(' <span id="loading" style="float: left; min-width: 35px; max-width: 35px; font-size: 85%; text-align: center;"> (Loading) </span> ').insertBefore($(this).find('a').first()); });
                if ( !live && stor_title in movie_db && movie_db[stor_title]!==false ) {
                    updateElement_dl(stor_title);
                    return true;
                }else{
                    if (from_imdb){
                        var url = 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&q=' + encodeURIComponent(title + ' (' + year + ')');
                        $('#loading', dl_element).text('1/2');
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: url,
                            onload: function(response) {
                                var resp = JSON.parse(response.responseText);
                                var results = [];
                                var data = [];
                                if(resp.title_popular){
                                    results = $.merge(results, resp.title_popular);
                                }
                                if(resp.title_exact){
                                    results = $.merge(results, resp.title_exact);
                                }
                                if(resp.title_approx){
                                    results = $.merge(results, resp.title_approx);
                                }
                                if(reM.exec(year)){
                                    $.each(results, function(index, item){
                                        if(item.title_description.indexOf(year)>-1 || item.title_description.indexOf(parseInt(year)+1)>-1 || item.title_description.indexOf(parseInt(year)-1)>-1){
                                            data = $.merge(data, [item]);
                                        }
                                    });
                                    results = data;
                                }else{
                                    $.each(results, function(index, item){
                                        if(item.title_description.toLowerCase().indexOf('series')>-1){
                                            data = $.merge(data, [item]);
                                        }
                                    });
                                    results = data;
                                }
                                data = 0;
                                $.each(results, function(index, item){
                                    if(data===0 && item.title==title){
                                        data = item;
                                    }
                                });
                                if(data===0){ data = results[0]; }
                                if (data){
                                    var movie_imdb = {};
                                    movie_imdb.imdbID = data.id;
                                    movie_imdb.Title = '<a href="http://www.imdb.com/title/'+movie_imdb.imdbID+'" target="_blank">'+data.title+'</a>';
                                    movie_imdb.Year = /[0-9]{4}/.exec(data.title_description);  movie_imdb.Year = movie_imdb.Year[0];
                                    getImdbInfoByID(movie_imdb.imdbID, stor_title, movie_imdb);
                                }else{
                                    $('#loading', dl_element).text(' ⚠ ').attr('title', 'Not found');
                                }
                            },
                            onerror: function(e1){
                                $('#loading', dl_element).text(' ⛌ ').attr('title', 'Error in searching for title');
                                console.warn('request failed: ' + url);
                            }
                        });
                    } else {
                        var url2 = 'http://www.omdbapi.com/?apikey=' + API_KEY_OMDB + '&t=' + encodeURIComponent(title) + '&y=' + encodeURIComponent(year) + '&plot=full&r=json';
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: url2,
                            onload: function(response) {
                                var data = JSON.parse(response.responseText);
                                //console.log(data);
                                if (data.Response === 'False') {
                                    if((title+" ").indexOf("s ")-(title+" ").indexOf("'s ") > 1){
                                        return getImdbInfo((title+" ").replace("s ", "'s "), year, dl_element);
                                    }else{
                                        movie_db[stor_title] = false;
                                        updateElement_dl(stor_title);
                                        count++;
                                    }
                                } else {
                                    let movie_imdb = {
                                        imdbID: data.imdbID,
                                        Title: '<a href="http://www.imdb.com/title/'+data.imdbID+'" target="_blank">'+data.Title+'</a>',
                                        Year: data.Year,
                                    };
                                    getImdbInfoByID(data.imdbID, stor_title, movie_imdb);
                                    return true;
                                }
                                localStorage.setItem('movie_db', JSON.stringify(movie_db));
                            },
                            onerror: function(){
                                console.warn('request failed: ' + url2);
                            }
                        });
                    }
                }
            };

            $(document).ready(function() {
                $('a').each(function() {
                    var href = $(this).attr("href");
                    var torrentz = /^\/([a-zA-Z0-9]{40})/i.exec(href);
                    var piratebay = /^\/torrent\/([0-9])/i.exec(href);
                    var hash = (/(^\/|^magnet\:\?xt\=urn\:btih\:)([a-zA-Z0-9]{40})/i.exec( $(this).attr('href') ));
                    if ( ( this.innerHTML.toLowerCase().indexOf('xxx') + this.innerHTML.toLowerCase().indexOf('porn') ) > -1 ) {
                        this.outerHTML = '';
                    }

                    var name = $(this).text();
                    if(hash){
                        hash = hash[2].toUpperCase();
                        /////////////////////////////////////////////////////// Loading Magnet from piratebay
                        var elem = '<span style="opacity:0.8; font-size:85%; position:absolute; display:none;" class="download-links">';
                        elem += '<a target="_blank" href="http://torrage.info/torrent.php?h='+hash+'"        style="display: inline-block; padding:0 5px 0 5px; background-color:#748DAB; text-align:center;">t1</a> ';
                        elem += '<a target="_blank" href="http://www.btcache.me/torrent/'+hash+'"            style="display: inline-block; padding:0 5px 0 5px; background-color:#748DAB; text-align:center;">t1</a> ';
                        elem += '<a target="_blank" href="http://torrentproject.se/torrent/'+hash+'.torrent" style="display: inline-block; padding:0 5px 0 5px; background-color:#748DAB; text-align:center;">m</a> ';
                        elem += '</span>';
                        $(elem).insertAfter($(this));
                        $(this).on('mouseover', function(e){ $(this).next('.download-links').stop(true, true).show(); });
                        $(this).on('mouseout', function(e){ $(this).next('.download-links').hide('slow'); });
                        $(this).next('.download-links').on('mouseover', function(e){ $(this).stop(true, true).show(); });
                        $(this).next('.download-links').on('mouseout', function(e){ $(this).hide('slow'); });
                    }

                });
            });

            start_button.find('#clear').click(function() {
                localStorage.removeItem('movie_db');
                localStorage.removeItem('full_magnets');
            });
            start_button.find('#start').click(function() {
                from_imdb = start_button.find('#from_imdb').is(':checked');
                live = start_button.find('#live').is(':checked');
                start_button.hide();
                poster_img = $('<table style="position: fixed; width:475px; height:283px; color:#000; background-color:white; border:3px solid #222; border-collapse: collapse; border-spacing:0px; cell-spacing:0px; z-index:9999;"><tr>' +
                               '<td><a href="" target="_blank" title="" id="imdb_poster" style="width:200px; height: 283px; display:flex;" onclick="javascript:if(this.getAttribute(\'href\')!=\'#\') window.open(this.getAttribute(\'href\'), \'\', \'width=600, height=600\'); return false;"><img src="http://ia.media-imdb.com/images/G/01/imdb/images/nopicture/large/film-184890147._CB379391879_.png" style="width: 100%; height: 100%;"></a></td>' +
                               '<td style="border:1px solid #222;"><div style="text-align:left; padding:3px; font-size:10pt; font-family:Tahoma; height:277px; overflow:auto; display:inline-block;">' +
                               '  <div style="text-align:center; font-size:125%pt; font-weight:bold;">' +
                               '    <span id="imdb_title">The Martian</span> (<span id="imdb_year">2015</span>)' +
                               '  </div>' +
                               '  <span id="imdb_trailer">(<a title="Play trailer" href="" target="_new" onclick="javascript:if(this.getAttribute(\'href\')!=\'#\') window.open(this.getAttribute(\'href\'), \'\', \'width=900, height=500\'); return false;"><u>▶</u></a>)</span>, ' +
                               '  <span id="imdb_rating">8.1</span><span style="color:grey;">/10</span> (<span id="imdb_votes">275,300</span> votes), <span id="imdb_metascore">-</span> Metascore' +
                               '  <br /><u>Box Office Gross</u>: <span id="imdb_boxofficegross">$123,456,789</span>' +
                               '  <br /><u>Genre</u>: <span id="imdb_genre">Adventure, Comedy, Drama</span>' +
                               '  <br /><u>Rated</u>: <span id="imdb_rated">PG-13</span>, <u>Runtime</u>: <span id="imdb_runtime">144 min</span>' +
                               '  <br /><u>Awards</u>: <span id="imdb_awards"></span>' +
                               '  <br /><u>Actors</u>: <span id="imdb_actors">Matt Damon, Jessica Chastain, Kristen Wiig, Jeff Daniels</span>' +
                               '  <br /><u>Director</u>: <span id="imdb_director">Ridley Scott</span>' +
                               //'  <br /><u>Writer</u>: <span id="imdb_writer">Drew Goddard (screenplay), Andy Weir (book)</span>' +
                               //'  <br /><u>Country</u>: <span id="country">USA, UK</span>' +
                               '  <br /><u>Plot</u>: <span id="imdb_plot">During a manned mission to Mars, Astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew. But Watney has survived and finds himself stranded and alone on the hostile planet. With only meager supplies, he must draw upon his ingenuity, wit and spirit to subsist and find a way to signal to Earth that he is alive.</span>' +
                               ' </div></td>' +
                               '</tr></table>');
                poster_img.on('mouseover', function(e){ poster_img.stop(true, true).show(); });
                poster_img.on('mouseout', function(e){ poster_img.stop(true, true).fadeOut(1000); });
                poster_img.hide();
                poster_img.appendTo('body');
                $('a').each(function() {
                    var href = $(this).attr("href");
                    var boxofficemojo = /^\/movies\/\?id=(.+)\.htm/i.exec(href);
                    var title = $(this).text().toLowerCase().replace(',', ' ').replace('.', ' ').replace('(', ' ').replace('1080p', '').replace('720p', '');
                    var year = '';
                    if (boxofficemojo){
                        title = $(this).text().toLowerCase();
                        if(!year){
                            year = /\(([0-9]{4}).*\)/.exec(title);
                            if(year){ // year from link text (if available)
                                title = title.replace(year[0], ' ').trim();
                                year = year[1];
                            }else{
                                year = /([0-9]{4})\.htm$/.exec(href);
                                if(year){ // year from link href (if available)
                                    year = year[1];
                                }else{ // year from GET parameter (if available)
                                    year = $.urlParam('yr');
                                    if(!year){ // year is current year
                                        //year = '-';
                                        year = (new Date()).getFullYear();
                                    }
                                }
                            }
                        }
                        match = title;
                    }else{
                        match = reM.exec(title);
                        if(match >= 1900){
                            year = match;
                            title = title.substr(0, title.search(reM)).trim();
                        }else{
                            match = reS.exec(title);
                            if(match){
                                year = '-';
                                title = title.substr(0, title.search(reS)).trim();
                            }
                        }
                    }

                    if (match){
                        if(match.length && count < 40) { // count increased by ajax call failures
                            $(this).parent().addClass(classFromTitle(title+'_'+year+'_'+from_imdb));
                            movie_loading[classFromTitle(title+'_'+year+'_'+from_imdb)] = [title, year];
                        } else if (match.length) {
                            title = title.substr(0, title.search(re));
                            var nel = '<a href="http://www.imdb.com/find?ref_=nv_sr_fn&q=' + title + '&s=all" target="_blank">??</a>';
                            $(this).parent().prepend(nel+ ' ');
                        }
                    } else {
                        $('a', this).css('color','#777');
                    }

                });
                var movies_in_page = $('<div class="movies_in_page" style="max-height:400px; width:550px; margin:auto; overflow:auto; text-align:left;"></div>');
                $.each(movie_loading, function( index, value ) {
                    $('<div class="'+index+'"><div style=""><a href="#" onClick="$(\'.'+index+'\').css(\'background-color\', \'yellow\')">'+$.toTitleCase(value[0])+' ('+value[1]+')</a></div></div>').appendTo(movies_in_page);
                });
                movies_in_page.insertAfter(start_button);
                $.each(movie_loading, function( index, value ) {
                    getImdbInfo(value[0], value[1]); // calls "updateElement_dl" from inside
                });
            });

            var classFromTitle = function(title) {
                return title.trim().replace(/[^a-zA-Z0-9]/g,'-');
            };

        } catch (e) {
            unsafeWindow.console.log(e);
        }
    }
}

if(typeof jQuery=='undefined') {
    var headTag = document.getElementsByTagName("head")[0];
    var jqTag = document.createElement('script');
    jqTag.type = 'text/javascript';
    jqTag.src = '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';
    jqTag.onload = jQueryCode;
    headTag.appendChild(jqTag);
} else {
     jQueryCode();
}
