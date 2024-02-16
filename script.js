/* global d3, topojson */
const
  hMargin = 70, // Horizontal margin - Compare with "width" and "container".
  vMargin = 40, // Vertical margin - compare with "height" and "container".
  paletteMargin = 25, // horizontal margin of the color palette inside the legend
  tipHeight = 50, // Tooltip box size.
  paletteHeight = 20, // Height of the color palette.
  paletteWidth = 30; // Width of each cell in the color palette.

const countyFile =
  'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';
const dataFile =
  'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const colors = ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];
const legendText = "% adults >= 25 with bachelor's degree";

const body = d3.select('body'),
  svg = d3.select('#svgContainer'),
  tooltip = d3.select('#tooltip'),
  path = d3.geoPath(),
  legend = d3.select('#legend').
    attr('width', paletteWidth * (colors.length + 2)).
    attr('height', paletteHeight * 2.5);

// Run the "draw" function; its arguments are the two files as converted into objects:
Promise.all([d3.json(countyFile), d3.json(dataFile)]).
  then(data => draw(data[0], data[1])).
  catch(err => console.log(err));

// Define the drawing function with two objects as arguments:
function draw(counties, marks) {
  //   Prepare the legend with domain defined by the data:
  const values = marks.map(item => item.bachelorsOrHigher),
    domainLow = Math.min(...values),
    domainHigh = Math.max(...values),
    colorScale = d3.scaleThreshold().
      domain(d3.range(domainLow, domainHigh, (domainHigh - domainLow) / colors.length)).
      range(colors),
    x = d3.scaleLinear().domain([domainLow, domainHigh]).range([paletteMargin, paletteMargin + paletteWidth * colors.length]);

  //   Create the colored rectangles of the legend with data from the "colors" array
  legend.
    selectAll('rect').
    data(colors).
    enter().
    append('rect').
    attr('x', (d, i) => paletteMargin + i * paletteWidth).
    attr('width', paletteWidth).
    attr('height', paletteHeight).
    style('fill', d => d);

  //   Create the text for the legend; set position and size.
  legend.append('text').
    attr('class', 'caption').
    attr('x', paletteMargin + paletteWidth).
    attr('y', 2.5 * paletteHeight).
    attr('fill', '#222').
    attr('text-anchor', 'start').
    style('font-size', paletteHeight / 2).
    style('font-style', 'italic').
    html(legendText);

  //  Create the legend axis
  //  Use concat to show the highest value to the tickvalues (d3.range omits it by default)
  const legendAxis = d3.axisBottom(x).
    tickSize(-10).
    tickFormat(val => Math.round(val) + '%').
    tickValues(colorScale.domain().concat(domainHigh));

  //  Place the legend axis in the correct location
  legend.append('g').
    attr('id', 'x-axis').
    attr('transform', 'translate(0,' + paletteHeight + ')').
    call(legendAxis);

  svg.
    append('g').
    attr('class', 'counties').
    selectAll('path').
    data(topojson.feature(counties, counties.objects.counties).features).
    join('path').
    attr('class', 'county') // Assign 'county' class to each path
    .attr('data-fips', d => d.id) // Assign 'data-fips' property
    .attr('data-education', function (d) {// Assign 'data-education' property
      const match = marks.filter(obj => obj.fips === d.id);
      return match[0] ? match[0].bachelorsOrHigher : 0;
    }).
    attr('fill', function (d) {// Fill each path with the corresponding color
      const match = marks.filter(obj => obj.fips === d.id);
      return match[0] ? colorScale(match[0].bachelorsOrHigher) : colorScale[0];
    }).
    attr('d', path).
    on('mouseover', function (event, d) {
      tooltip.style('opacity', 0.9);
      tooltip.
        html(function () {
          const match = marks.filter(obj => obj.fips === d.id);
          return match[0] ?
            match[0]['area_name'] + ', ' +
            match[0]['state'] + ': ' +
            match[0].bachelorsOrHigher + '%' :
            0;
        }).
        attr('data-education', function () {// Assign 'data-education' property
          const match = marks.filter(obj => obj.fips === d.id);
          return match[0] ? match[0].bachelorsOrHigher : 0;
        }).
        style('left', event.pageX + 5 + 'px').
        style('top', event.pageY - 35 + 'px');
    }).
    on('mouseout', () => tooltip.style('opacity', 0));

  //  Draw the borders of the states:
  svg.
    append('path').
    datum(
      topojson.mesh(counties, counties.objects.states, function (a, b) {
        return a !== b;
      })).

    attr('class', 'stateBorder').
    attr('d', path);

  //  Draw the borders of the counties:
  // svg
  //   .append('path')
  //   .datum(
  //     topojson.mesh(counties, counties.objects.counties, function (a, b) {
  //       return a !== b;
  //     })
  //   )
  //   .attr('class', 'countyBorder')
  //   .attr('d', path);
}