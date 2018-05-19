(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
document.addEventListener("DOMContentLoaded", function () {
    btn = document.getElementById('nav-btn')
    nav = document.querySelector('nav')
    logo = document.getElementById('logo')
    logoHeight = logo.clientHeight
    // document.getElementById('logo-wrapper').style.height = `${logoHeight}px`

    btn.onclick = navOn
    // window.addEventListener('scroll', debounce(onScroll, 50))

    function navOn(event) {
        nav.classList.toggle('on')
        nav.classList.toggle('off')
    }

    function onScroll(){
       if (window,pageYOffset > logoHeight){
           console.log(logoHeight)
           logo.classList.add('fixed')
       }
       else {
           logo.classList.remove('fixed')
       }
    }

    //as taken from  underscore
    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };


})

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxwZXJzb25hbFxcd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovcGVyc29uYWwvd2F5bG9ud2Fsa2VyLmdpdGh1Yi5pby9zdGF0aWMvZXM2L2Zha2VfZmNlNTQ0YmIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtYnRuJylcclxuICAgIG5hdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ25hdicpXHJcbiAgICBsb2dvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28nKVxyXG4gICAgbG9nb0hlaWdodCA9IGxvZ28uY2xpZW50SGVpZ2h0XHJcbiAgICAvLyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby13cmFwcGVyJykuc3R5bGUuaGVpZ2h0ID0gYCR7bG9nb0hlaWdodH1weGBcclxuXHJcbiAgICBidG4ub25jbGljayA9IG5hdk9uXHJcbiAgICAvLyB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZGVib3VuY2Uob25TY3JvbGwsIDUwKSlcclxuXHJcbiAgICBmdW5jdGlvbiBuYXZPbihldmVudCkge1xyXG4gICAgICAgIG5hdi5jbGFzc0xpc3QudG9nZ2xlKCdvbicpXHJcbiAgICAgICAgbmF2LmNsYXNzTGlzdC50b2dnbGUoJ29mZicpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25TY3JvbGwoKXtcclxuICAgICAgIGlmICh3aW5kb3cscGFnZVlPZmZzZXQgPiBsb2dvSGVpZ2h0KXtcclxuICAgICAgICAgICBjb25zb2xlLmxvZyhsb2dvSGVpZ2h0KVxyXG4gICAgICAgICAgIGxvZ28uY2xhc3NMaXN0LmFkZCgnZml4ZWQnKVxyXG4gICAgICAgfVxyXG4gICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgbG9nby5jbGFzc0xpc3QucmVtb3ZlKCdmaXhlZCcpXHJcbiAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9hcyB0YWtlbiBmcm9tICB1bmRlcnNjb3JlXHJcbiAgICBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcclxuICAgICAgICB2YXIgdGltZW91dDtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcclxuICAgICAgICAgICAgaWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG5cclxufSlcclxuIl19
