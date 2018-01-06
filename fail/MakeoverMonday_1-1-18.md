Title: Makeover Monday 1-1-2018
Date: 12/31/2017
Category: Makeover Monday
Tags: Data Visualization, Data Science

# Makeover Monday 1-1-2018

2018 begins a new era in my career I am transitioning away from my mechanical engineering field and into the field of data science.  Well not completely away from ME, as one of my strengths is a deep subject matter expertise in our product from the engineering side.  I'll admit its kinda scary making a big career jump, especially one that is so new.  Will this job survive the test of time?  Will college grads out compete me with their finely tuned skill sets in that art of Data Science?  Only time will tell.  One thing for sure is that its time to start stepping up my game in data visualization.

In the past my focus on data visualization has been primarily technical, and trying to find answers for my own questions with data.  Something I want to start getting better at is creating beautiful graphics that tell a clear story.  That is why I have chosen to join [Makeover Monday](http://www.makeovermonday.co.uk).  Each week they provide a visualization and data set that.  The visualization is not a bad visualization by any means, but it may be missing some key elements to tell a clear story.  

## Goals

* Do not take over family time
* Do not take over work time
* Limit to 30-60min
* Learn new libraries/frameworks/apps
* Hone skills in my core viz library
* Create beautiful visualizations
* Learn from the community

# Chicken Consumption Overtakes Red Meat

The first chart comes from theatlas. It is a nice viz with good style, but no story.  I feel like the colors look really pleasing together, but the chicken and pork colors tend to run together quite a bit.  Also its harder to tell the scale at which each trend is changing because it is not normalized to the overall consumption.

### original viz

<iframe src="https://www.theatlas.com/charts/SkwA7QzL" scrolling='no'></iframe>

_source: https://www.theatlas.com/charts/SkwA7QzL_

## My Viz

I feel like my viz leaves a lot to be desired here.  During this first round I feel that I wasted a bit of time on other tasks.  


### ETL 

I spent way too long on the ETL step.  I have used data.world before and love it for its simplicity, but for some reason when you click on import data into python it suggest to do the following.  I think I have a firewall setting or something that is currently preventing this method from working properly.

```python

import datadotworld as dw

dataset_key = 'makeovermonday/2018-w-1-u-s-per-capita-consumption-of-poultry-livestock'

# Load dataset (onto the local file system)
dataset_local = dw.load_dataset(dataset_key)  # cached under ~/.dw/cache
```

But clicking on the share URL gives you the following option. Which is much simpler for small datasets where you want to pull in the whole thing anyways.  

```python
import pandas as pd
df = pd.read_csv('https://query.data.world/s/AnMFhZ2dC7RJCTnpGsSCFBvr03a9kl')
```
### Turkey

I thought I could find a story to tell with the remarkable growth of Turkey through the 1980's, but was unable to find any reasoning in the short period of time that I had and just needed to get moving with something at this point.


<iframe src="https://goo.gl/XMT2WK" width='500'></iframe>


### Feature Engineering

Building off of the original visualization, I thought I could improve it by normalizing the consumption of red meat vs. poultry by the total amount of meat consumption.  I also converted the year to a proper date time format.

```python
meat_raw = pd.read_excel
('https://query.data.world/s/IdjIzez2eS7cdAWsdTTKdMF1HvK2X7')
meat = meat_raw
meat['Total'] = meat['Total Red Meat & Poultry'] + meat['Commercial Fish & Shell-Fish']
meat['% red meat'] = meat['Total Red Meat'].divide(meat['Total'])
meat['% poultry'] = meat['Total Poultry'].divide(meat['Total'])
meat['DATE'] = pd.to_datetime(meat['Year'], format='%Y')
```


### Final Viz

At this point I am already running out of time, so I quickly grab some colors to work with, put together a catchy title and use my current go-to viz library c3.js. I only spent a few minutets putting together the final viz.  I like that the colors are are improved over the original, and that its based on a percentage of overal consumption.

<iframe src="https://goo.gl/BU1SCJ"></iframe>


### Next time

Get right to the viz, and dont mess around so much with ETL.  Also I can see myself building up some standard style that makes it a bit easier to build infographic like displays in my own style.  I am really excited to start this adventure and get on to the next data set.



<!-- <style>@import url("https://goo.gl/RrPQm5")</style> -->
<style>@import url("https://goo.gl/TVghHH")</style>
