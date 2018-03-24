# Stepping up my SQL

In 2018 I transitioned from a Product Engineering (Mechanical) role to a Data Scientist Role.  I entered this space with strong subject matter expertise in our data, munging through data in pyhon, and data visualization in python.  My sql skills were lacking to say the least.  I had learned what I needed to know to get data from our relational databases, then use pandas to do any further analysis.    Just run something like the following and you have data.

``` sql
SELECT 
    * 
FROM 
    Table 
Where 
    col_1 = 'col_1_filter'
```

This works great for small data sets that you only need to run once.  There is no shame to pull in a big dataset and start munging with it in pandas to get some results, and make decisions.  The problem becomes when your dataset becomes too big or you need to run the query on a frequent basis.  Doing the aggregations on the server run much quicker, as it reduces the time spent in io.  My longest running steps are currently io related.  Reducing these steps have improved my workflow.  At the point that I was getting server timeout errors, or using the same long running query in many places I would be searching for examples online, because I just did not have the experience with many more techniques.


## [Joining Data in Posgres](https://campus.datacamp.com/courses/joining-data-in-postgresql)

I decided it was time to put away the cheat sheets, step away from Stack Overflow, and improve my speed.  Below are my notes from the [Joining Data in Posgres](https://campus.datacamp.com/courses/joining-data-in-postgresql)
course on DataCamp.  I will use these notes as a refresher when I need a quick reference.

### Using()
When joining two tables on the same column the ```USING``` clause can be used as a shorthand.

**without using**
```sql 
SELECT * 

FROM 
    Table1 as t1

LEFT JOIN 
    Table2 as t2
    ON t1.id = t2.id
```

**with using**
```sql 
SELECT 
    * 

FROM 
    Table1 as t1

LEFT JOIN 
    Table2 as t2
    USING (id)
```

### Join Types
_for joining columns of data together into a single table_

```INNER```: Includes only records contained in **both** tables.

```RIGHT```: Inlcudes all records from the **right**, droping values from the left if non-existent in the right, or leaving nulls if non-existant in the left.

```LEFT```: Inlcudes all records from the **left**, droping values from the right if non-existent in the left, or leaving nulls if non-existant in the right.

```FULL```: Combination of ```Left``` and ```Right``` Join, leaving nulls where data is missing in one table, and not droping any data.

```CROSS```: returns all **pairs** from two tables, does not have an on or using clause.

### Union
_for concatenating rows of data with the same columns_

```Union```: returns only unique records, does not include duplicates.

```Union All```: returns all records(including duplicates)

### Intersect

```Intersect```: returns only records appearing in both tables

### Execpt

```Except```: returns only records not in the second table

### Self-Joins

```Semi-Join```: Filters based on results of a subquery.  Does not have direct sql syntax.  This type of join is achieved through a subquery in the where statement.

```Anti-Join```: Similar to the Semi-join, but using a ```not``` modifier.  This is particularly useful for debugging situations.

### Subqueries

#### WHERE

Subqueries are commonly found in the where clause.  Below is an example given in the course to select only the Asian countries with below average fertility rate from the states table.  

``` sql
SELECT 
   name,
   fert_rate
FROM 
    states
WHERE 
    continent = 'Asia'
AND fert_rate <
        (SELECT AVG(fert_rate)
         FROM states;)
```

#### SELECT

``` sql
SELECT DISTINCT
    continent,
    (SELECT 
        COUNT(*)
     FROM 
        states
     WHERE 
        prime_ministers.continent = states.continent
    ) AS countries_num

From Prime Ministers
```

#### FROM

``` sql
SELECT DISTINCT
    monarchs.continent,
    subquery.max_perc

FROM
    monarchs,
    (SELECT
        continent,
        MAX(women_parli_perc AS max_perc

    FROM
        states

    GROUP BY 
        continent
    ) as subquery

WHERE
    monarchs.continent = subquery.continent

ORDER BY
    continent;
```

#### ON

**Challenge Problem 1**  This problem was the one that had me more stumped than any other problem in the course.  I found the subquery inside the on statement very confusing to understand.  In this question we are joining the countries table to a subquery what yields country codes of countries with offial languages from the languages table.

``` sql
SELECT DISTINCT
    c.name,
    e.total_investment,
    e.imports

FROM 
    countries as c
LEFT JOIN 
    economies as e
    ON c.code = e.code

    AND c.code in (
    SELECT 
        l.code 
    FROM 
        languages as l
    WHERE 
        official = true
    )

WHERE 
    c.region = 'Central America'
AND e.year = 2015

ORDER BY 
    c.name asc;
```
