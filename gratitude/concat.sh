cat $( ls -r *.md ) | pandoc -o content.html
sassc gratitude.sass > gratitude.css
pug index.pug