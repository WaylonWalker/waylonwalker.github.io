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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxwZXJzb25hbFxcd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovcGVyc29uYWwvd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pby9zdGF0aWMvZXM2L2Zha2VfZTMxN2U1Yi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGJsb2cgPSBuZXcgQmxvZygpXHJcbiAgICBibG9nLnByb21vKGJsb2cubmV4dF91cmwsICcjbmV4dCcpXHJcbiAgICBibG9nLnByb21vKGJsb2cucHJldl91cmwsICcjcHJldicpXHJcbn0pXHJcblxyXG5mdW5jdGlvbiBCbG9nKCkge1xyXG4gICAgdGhpcy51cmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcclxuICAgIHRoaXMucm9vdCA9IHRoaXMudXJsLnN1YnN0cigxLCB0aGlzLnVybC5zdWJzdHIoMSkuc2VhcmNoKCcvJykpXHJcbiAgICB0aGlzLm4gPSBwYXJzZUludCh0aGlzLnVybC5zbGljZSh0aGlzLnVybC5zdWJzdHIoMSkuc2VhcmNoKCcvJykgKyAyLCB0aGlzLnVybC5sYXN0SW5kZXhPZignLycpKSlcclxuXHJcbiAgICBpZiAoaXNOYU4odGhpcy5uKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCduYW4nKVxyXG4gICAgICAgIHRoaXMubiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYG1ldGFbbmFtZT0nJHt0aGlzLnJvb3R9Om4nXWApLmdldEF0dHJpYnV0ZSgnY29udGVudCcpXHJcbiAgICAgICAgY29uc29sZS5sb2coYGluZGV4X246ICR7dGhpcy5ufWApXHJcbiAgICAgICAgdGhpcy5uZXh0X3VybCA9IGAvJHt0aGlzLnJvb3R9LzEvYFxyXG4gICAgICAgIHRoaXMucHJldl91cmwgPSBgLyR7dGhpcy5yb290fS8ke3RoaXMubiAtIDF9L2BcclxuICAgIH0gZWxzZSBpZiAodGhpcy5uID09PSAxKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0X3VybCA9IGAvJHt0aGlzLnJvb3R9LyR7dGhpcy5uICsgMX0vYFxyXG4gICAgICAgIHRoaXMucHJldl91cmwgPSBgLyR7dGhpcy5yb290fS9gXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubmV4dF91cmwgPSBgLyR7dGhpcy5yb290fS8ke3RoaXMubiArIDF9L2BcclxuICAgICAgICB0aGlzLnByZXZfdXJsID0gYC8ke3RoaXMucm9vdH0vJHt0aGlzLm4gLSAxfS9gXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9tbyA9IGZ1bmN0aW9uKHVybCwgZGl2KSB7XHJcbiAgICAgICAgZmV0Y2godXJsKVxyXG4gICAgICAgICAgICAudGhlbigocmVzcCkgPT4gcmVzcC50ZXh0KCkpXHJcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCkuZG9jdW1lbnRFbGVtZW50XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gZGF0YVxyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIm1ldGFbcHJvcGVydHk9J29nOnRpdGxlJ11cIikuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKVxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIm1ldGFbcHJvcGVydHk9J29nOmRlc2NyaXB0aW9uJ11cIikuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKVxyXG4gICAgICAgICAgICAgICAgbmV4dF9wb3N0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihkaXYpXHJcbiAgICAgICAgICAgICAgICBuZXh0X3Bvc3QuaW5uZXJIVE1MID0gYFxyXG4gICAgICAgICAgICAgICA8aDE+JHt0aXRsZX08L2gxPlxyXG4gICAgICAgICAgICAgICA8cD5cclxuICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7dXJsfVwiPlJlYWQgTW9yZSA8aSBjbGFzcyA9IFwiZmEgZmEtbG9uZy1hcnJvdy1yaWdodFwiIGFyaWEtaGlkZGVuPSd0cnVlJz48L2k+PC9hPlxyXG4gICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgIDxwPlxyXG4gICAgICAgICAgICAgICAke2Rlc2NyaXB0aW9ufSBcclxuICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7dXJsfS9cIj5SZWFkIE1vcmUgPGkgY2xhc3MgPSBcImZhIGZhLWxvbmctYXJyb3ctcmlnaHRcIiBhcmlhLWhpZGRlbj0ndHJ1ZSc+PC9pPjwvYT5cclxuICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgICBgXHJcbiAgICAgICAgICAgICAgICBuZXh0X3Bvc3QuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZScpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuIl19
