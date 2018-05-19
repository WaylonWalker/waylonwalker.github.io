# cookiecutter-reveal-pug

Quick reveal slides with pug syntax

## Benefits

* Avoid [Death By PowerPoint](https://www.youtube.com/watch?v=Iwpi1Lm6dFo)
    * easily create stretched out presentations
    * Print with speaker notes
    * Increased contrast
* include interactive visualizations
* easily update visualizations and data


> If you have not seen David JP Phillips [Death By PowerPoint](https://www.youtube.com/watch?v=Iwpi1Lm6dFo)  TEDx, stop now and watch it.  You will never look at slides the same again.  Watching this video ruined me for watching presentations with these issues.  Reveal is a tool that makes it very easy to follow these principles



## Usage

```cmd
cookiecutter reveal-pug
cd ./project_name
subl .
render.bat
```


## requirements

pug_reveal requires a pug compiler.  

```cmd
npm i -g pug-cli
```


## creating slides

1. Work out of the `/slides` directory in a `.pug` file.
* When working on slides run the render.bat file


### Basics

coming soon...


## rendering slides

To render slides from the `/slides` directory run the render.bat file


```cmd
render.bat
```