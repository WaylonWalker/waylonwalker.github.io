Title: Pycon 2018 Roundup
Date: 5/12/2018
Category: Blog
Tags: Python, Pycon, Youtube
Summary: These are my notes from pycon 2018 videos.  I love the python community and especially the conference talks.  This year I am going to take some notes from my favorite talks and post them here.

These are my notes from pycon 2018 videos.  I love the python community and especially the conference talks.  This year I am going to take some notes from my favorite talks and post them here.

This is an **Incomplete** working post.


## [Jake VanderPlas - Performance Python: Seven Strategies for Optimizing Your Numerical Code](https://www.youtube.com/watch?v=zQeYx87mfyw)
* **Always** profile **before** making any optimizations.
* Vectorize with Numpy
    * Looping in python can be slow
* Use specialized data structures.
    * scipy.spacial
    * pandas
    * xarray
    * scipy.sparse
    * sparse package
    * scipy.sparce.csgraph 
* Cython
    * Add types
* Numba
    * jit
    * Fortran Like Speed
    * heavy dependencies
* Dask
    * distributed tasks
    * Can be executed locally or on a cluster
* Look for an existing package
    * **resist the urge to reinvent the wheel**  

[![Click to Watch](http://img.youtube.com/vi/zQeYx87mfyw/0.jpg)](https://www.youtube.com/watch?v=zQeYx87mfyw)

## [Jason Huggins - Keynote ](https://www.youtube.com/watch?v=q-x7jK72E6E)

Jason had a great talk about teaching kids to code through his experiences with First Lego League.  He found that the event has the best of intentions, but does lend itself to schools with a larger budget that is able to order many different kits.  He has found himself deep down a rabbit hole of finding an affordable alternative that can be done with the inexpensive raspbery pi zero, and controlled  with the cheapest tablets.  He is currently working on a programming language called wildcard, that can be programmed with paper.  This really reminds me of a game that I play with my 5 year old son [Robot Turtles](www.robotturtles.com).  He really likes to play it.  I will definitely be following this project to see if this is something that I can do with him when its ready.

[![Click to Watch](http://img.youtube.com/vi/q-x7jK72E6E/0.jpg)](https://www.youtube.com/watch?v=q-x7jK72E6E)

## [Alex Petralia - Analyzing Data: What pandas and SQL Taught Me About Taking an Average](https://www.youtube.com/watch?v=DlgG0QdrqAU)


Asks the right questions before writing the first line of code.  Even the simplest questions such as averages have many possible pitfalls along the way.  Alex discusses how to prepare your data before averaging in this talk.  He brings some new _"Jargon"_ .  I am not sure that this jargon made this any easier for me to understand or discuss.  It may take some time for this one to sink in to become effective.  I feel like using plain english is more effective as it is more easily understood by anyone.  "find the **daily** average **sales** by **seller**"
### Jargon
**Collapsing key:** 
* the collapsed/aggregated data relevant to this analysis  
* _we are overriding the primary key (i.e. what a table defines as an observation)_
* the original number of rows

**Grouping key:** the key defining a group**  
* _eg. "for each Seller" is (seller), "for each Country and city is (Country, City)_  
* this defines how many rows are in the result

** Obvervation key: a unit of observation for this analysis**  
* _eg. "daily average" is (Date), "across regions" is (Region)_
* this defines how many rows are in the denominator

### Formula
Collapsing Key - Grouping Key = Observation Key

### Example Question
Calculate the Average Daily Sales for each Seller.

**Collapsing Key:** (Date, Seller)
**Grouping Key:** (Seller)
**Observation Key:** (Date)

### data set

| id | Date    | Seller | ApplesSold |
|----|---------|--------|------------|
| 1  | Monday  | Mary   | 5          |
| 1  | Monday  | Bob    | 4          |
| 1  | Tuesday | Bob    | 8          |
| 1  | Thursday| Jane   | 10         |
| 1  | Thursday| Jane   | 6          |

### SQL Example
```SQL
SELECT
    Seller,
    AVG(total)
FROM (
    SELECT
       DATE,
       SELLER,
       SUM(ApplesSold) AS total
    FROM
       Apples
    GROUP BY
       DATE,
       SELLER -- Collapsing Key
    ) as t
GROUP BY
    Seller -- Grouping Key

    
```
### Pandas Example
I am interested in trying out this technique of using the second groupby.  I typically use an unstack instead, but that relies on having the order of the Collapsing key correct.
```python
(pd
    .groupby(['Date', 'Seller']) # Collapsing Key
    ['ApplesSold']
    .sum()
    .groupby(level='Seller') # Grouping Key
    .mean()
    )
```


[![Click to Watch](http://img.youtube.com/vi/DlgG0QdrqAU/0.jpg)](https://www.youtube.com/watch?v=DlgG0QdrqAU)

