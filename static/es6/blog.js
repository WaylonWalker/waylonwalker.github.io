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
