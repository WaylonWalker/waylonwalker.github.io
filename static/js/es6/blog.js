(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
document.addEventListener("DOMContentLoaded", function () {
    blog = new Blog()
    blog.promo(blog.next_url, '#next')
    blog.promo(blog.prev_url, '#prev')
})

function Blog() {
    this.url = window.location.pathname
    this.root = this.url.substr(1, this.url.substr(1).search('/'))
    this.n = parseInt(this.url.slice(this.url.substr(1).search('/') + 2, this.url.lastIndexOf('/')))

    if (isNaN(this.n)) {
        console.log('nan')
        this.n = document.querySelector(`meta[name='${this.root}:n']`).getAttribute('content')
        console.log(`index_n: ${this.n}`)
        this.next_url = `/${this.root}/1/`
        this.prev_url = `/${this.root}/${this.n - 1}/`
    } else if (this.n === 1) {
        this.next_url = `/${this.root}/${this.n + 1}/`
        this.prev_url = `/${this.root}/`
    } else {
        this.next_url = `/${this.root}/${this.n + 1}/`
        this.prev_url = `/${this.root}/${this.n - 1}/`
    }

    this.promo = function(url, div) {
        fetch(url)
            .then((resp) => resp.text())
            .then((data) => {
                var container = document.implementation.createHTMLDocument().documentElement
                container.innerHTML = data
                title = container.querySelector("meta[property='og:title']").getAttribute("content")
                description = container.querySelector("meta[property='og:description']").getAttribute("content")
                next_post = document.querySelector(div)
                next_post.innerHTML = `
               <h1>${title}</h1>
               <p>
               <a href="${url}">Read More <i class = "fa fa-long-arrow-right" aria-hidden='true'></i></a>
               </p>
               <p>
               ${description} 
               <a href="${url}/">Read More <i class = "fa fa-long-arrow-right" aria-hidden='true'></i></a>
               </p>
               `
                next_post.classList.remove('hide')
            })
    }
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxwZXJzb25hbFxcd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovcGVyc29uYWwvd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pby9zdGF0aWMvZXM2L2Zha2VfZDFiZjhmOGQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBibG9nID0gbmV3IEJsb2coKVxyXG4gICAgYmxvZy5wcm9tbyhibG9nLm5leHRfdXJsLCAnI25leHQnKVxyXG4gICAgYmxvZy5wcm9tbyhibG9nLnByZXZfdXJsLCAnI3ByZXYnKVxyXG59KVxyXG5cclxuZnVuY3Rpb24gQmxvZygpIHtcclxuICAgIHRoaXMudXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICB0aGlzLnJvb3QgPSB0aGlzLnVybC5zdWJzdHIoMSwgdGhpcy51cmwuc3Vic3RyKDEpLnNlYXJjaCgnLycpKVxyXG4gICAgdGhpcy5uID0gcGFyc2VJbnQodGhpcy51cmwuc2xpY2UodGhpcy51cmwuc3Vic3RyKDEpLnNlYXJjaCgnLycpICsgMiwgdGhpcy51cmwubGFzdEluZGV4T2YoJy8nKSkpXHJcblxyXG4gICAgaWYgKGlzTmFOKHRoaXMubikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnbmFuJylcclxuICAgICAgICB0aGlzLm4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBtZXRhW25hbWU9JyR7dGhpcy5yb290fTpuJ11gKS5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnQnKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBpbmRleF9uOiAke3RoaXMubn1gKVxyXG4gICAgICAgIHRoaXMubmV4dF91cmwgPSBgLyR7dGhpcy5yb290fS8xL2BcclxuICAgICAgICB0aGlzLnByZXZfdXJsID0gYC8ke3RoaXMucm9vdH0vJHt0aGlzLm4gLSAxfS9gXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMubiA9PT0gMSkge1xyXG4gICAgICAgIHRoaXMubmV4dF91cmwgPSBgLyR7dGhpcy5yb290fS8ke3RoaXMubiArIDF9L2BcclxuICAgICAgICB0aGlzLnByZXZfdXJsID0gYC8ke3RoaXMucm9vdH0vYFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm5leHRfdXJsID0gYC8ke3RoaXMucm9vdH0vJHt0aGlzLm4gKyAxfS9gXHJcbiAgICAgICAgdGhpcy5wcmV2X3VybCA9IGAvJHt0aGlzLnJvb3R9LyR7dGhpcy5uIC0gMX0vYFxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucHJvbW8gPSBmdW5jdGlvbih1cmwsIGRpdikge1xyXG4gICAgICAgIGZldGNoKHVybClcclxuICAgICAgICAgICAgLnRoZW4oKHJlc3ApID0+IHJlc3AudGV4dCgpKVxyXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgpLmRvY3VtZW50RWxlbWVudFxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGRhdGFcclxuICAgICAgICAgICAgICAgIHRpdGxlID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCJtZXRhW3Byb3BlcnR5PSdvZzp0aXRsZSddXCIpLmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIilcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCJtZXRhW3Byb3BlcnR5PSdvZzpkZXNjcmlwdGlvbiddXCIpLmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIilcclxuICAgICAgICAgICAgICAgIG5leHRfcG9zdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZGl2KVxyXG4gICAgICAgICAgICAgICAgbmV4dF9wb3N0LmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgPGgxPiR7dGl0bGV9PC9oMT5cclxuICAgICAgICAgICAgICAgPHA+XHJcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke3VybH1cIj5SZWFkIE1vcmUgPGkgY2xhc3MgPSBcImZhIGZhLWxvbmctYXJyb3ctcmlnaHRcIiBhcmlhLWhpZGRlbj0ndHJ1ZSc+PC9pPjwvYT5cclxuICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgICA8cD5cclxuICAgICAgICAgICAgICAgJHtkZXNjcmlwdGlvbn0gXHJcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke3VybH0vXCI+UmVhZCBNb3JlIDxpIGNsYXNzID0gXCJmYSBmYS1sb25nLWFycm93LXJpZ2h0XCIgYXJpYS1oaWRkZW49J3RydWUnPjwvaT48L2E+XHJcbiAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgYFxyXG4gICAgICAgICAgICAgICAgbmV4dF9wb3N0LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUnKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbiJdfQ==
