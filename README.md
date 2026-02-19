## Why I Chose This Map Type

**URL Link:**: https://willyh23.github.io/smartdashboard-/ 

For this dashboard, I went with a **proportional symbol map** mixed with **categorical coloring**. I thought this was the best way to handle the Seattle parking data because it lets you see two different things at once without the map getting too crowded.

### 1. Scaling the Circles (Proportional Symbols)
I used the `Amount Paid` attribute to control the size of the circles. My goal was to make high-revenue areas stand out immediately. That way, you can spot the "expensive" blocks in Seattle as soon as the map loads, instead of having to click on every single dot to see the price. 

*Note: Since I limited this to the first 30 data points to keep the map fast, the price differences are actually pretty small. I kept the size variations subtle on purpose so the circles wouldn't overlap and look messy.*

### 2. Color Coding (Categories)
I used `Payment Mean` for the colors (Blue for Credit Cards and Orange for Phone payments). This adds a second layer to the data—it’s not just about how much people are paying, but *how* they're doing it. It’s an easy way to see if certain areas prefer using an app over a physical card reader.

### 3. Cleaning up the View
A big headache while building this was the "Blockface Name" data. The original names were way too long (like "6TH AVE N BETWEEN ST AND ST"), which completely broke my bar chart. I ended up splitting those names so they only show the main street. It makes the side panel way easier to read and keeps the whole dashboard looking organized.

Overall, this setup turns a simple CSV into a "Smart Dashboard" where you can actually see trends and payment habits at a glance.