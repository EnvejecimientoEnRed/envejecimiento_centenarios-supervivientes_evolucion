import { numberWithCommas, numberWithCommas2 } from './helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './modules/canvas-image';
import { setRRSSLinks } from './modules/rrss';
import './modules/tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let dataSource = 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/envejecimiento_centenarios-supervivientes_evolucion/main/data/evolucion_supervivientes.csv';
let tooltip = d3.select('#tooltip');

//Variables para visualización
let innerData = [], chartBlock = d3.select('#chart'), chart, x_c, x_cAxis, y_c, y_cAxis;
let line_1, path_1, length_1, line_2, path_2, length_2, line_3, path_3, length_3;

initChart();

function initChart() {
    let csv = d3.dsvFormat(';');
    d3.text(dataSource, function (error, data) {
        if (error) throw error;

        innerData = csv.parse(data);
        innerData = innerData.reverse();

        //Desarrollo del gráfico > Debemos hacer muchas variables genéricas para luego actualizar el gráfico
        let margin = {top: 5, right: 17.5, bottom: 25, left: 40};
        let width = parseInt(chartBlock.style('width')) - margin.left - margin.right,
            height = parseInt(chartBlock.style('height')) - margin.top - margin.bottom;

        chart = chartBlock
            .append('svg')
            .lower()
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Eje X
        x_c = d3.scaleLinear()
            .domain([1991,2019])
            .range([0, width]);

        x_cAxis = function(g){
            g.call(d3.axisBottom(x_c).tickFormat(function(d) { return d; }))
            g.call(function(g){
                g.selectAll('.tick line')
                    .attr('y1', '0%')
                    .attr('y2', '-' + height + '')
            })
            g.call(function(g){g.select('.domain').remove()});
        }

        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class','x_c-axis')
            .call(x_cAxis);

        //Eje Y
        y_c = d3.scaleLinear()
            .domain([0, 4000])
            .range([height,0])
            .nice();
    
        y_cAxis = function(svg){
            svg.call(d3.axisLeft(y_c).ticks(5).tickFormat(function(d) { return numberWithCommas2(d); }))
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr("x1", '0')
                    .attr("x2", '' + width + '')
            })
            svg.call(function(g){g.select('.domain').remove()})
        }        
        
        chart.append("g")
            .attr('class','y_c-axis')
            .call(y_cAxis);

        //Línea
        line = d3.line()
            .x(d => x_c(+d.Anyo))
            .y(d => y_c(d.supervivientes_total.replace(',','.')))
            .curve(d3.curveNatural);

        path_1 = chart.append("path")
            .data([innerData])
            .attr("class", 'line-chart')
            .attr("fill", "none")
            .attr("stroke", 'rgb(41, 101, 101)')
            .attr("stroke-width", '2px')
            .attr("d", line);

        length_1 = path_1.node().getTotalLength();

        path_1.attr("stroke-dasharray", length_1 + " " + length_1)
            .attr("stroke-dashoffset", length_1)
            .transition()
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .duration(3000);

        chart.selectAll('circles')
            .data(innerData)
            .enter()
            .append('circle')
            .attr('class', 'circle-chart')
            .attr("r", '3.5')
            .attr("cx", function(d) { return x_c(+d.Anyo)})
            .attr("cy", function(d) { return y_c(d.supervivientes_total.replace(',','.')); })
            .style("fill", 'transparent')
            .style("stroke", 'rgb(41, 101, 101)')
            .style('opacity', '0')
            .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                let circles = document.getElementsByClassName('circle-chart');

                //Darle mayor presencia
                for(let i = 0; i < circles.length;i++) {
                    circles[i].style.opacity = '0.4';
                }
                this.style.opacity = '1';

                //Texto
                let html = '<p class="chart__tooltip--title">' + d.Anyo + '</p>' + '<p class="chart__tooltip--text">Media ponderada: ' + numberWithCommas2(parseInt(d.supervivientes_total.replace('.',','))) + '</p>' +
                '<p class="chart__tooltip--text">Mujeres: ' + numberWithCommas2(parseInt(d.supervivientes_mujeres.replace('.',','))) + '</p>' + 
                '<p class="chart__tooltip--text">Hombres: ' + numberWithCommas2(parseInt(d.supervivientes_hombres.replace('.',','))) + '</p>';
                
                tooltip.html(html);

                //Tooltip
                positionTooltip(window.event, tooltip);
                getInTooltip(tooltip);               
            })
            .on('mouseout', function(d, i, e) {
                let circles = document.getElementsByClassName('circle-chart');
                //Darle mayor presencia
                for(let i = 0; i < circles.length;i++) {
                    circles[i].style.opacity = '1';
                }
                //Quitamos el tooltip
                getOutTooltip(tooltip);                
            })
            .transition()
            .delay(function(d,i) { return i * (3000 / innerData.length - 1)})
            .style('opacity', '1');

        setTimeout(() => {
            setChartCanvas(); 
        }, 4000);
    });
}

function animateChart() {
    //Opción de tener dos líneas
    path_1 = chart.select(".line-chart")
        .data([innerData])
        .attr("class", 'line-chart')
        .attr("fill", "none")
        .attr("stroke", 'rgb(41, 101, 101)')
        .attr("stroke-width", '2px')
        .attr("d", line);

    length_1 = path_1.node().getTotalLength();

    path_1.attr("stroke-dasharray", length_1 + " " + length_1)
        .attr("stroke-dashoffset", length_1)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    chart
        .selectAll('.circle-chart')
        .remove();

    chart.selectAll('circles')
        .data(innerData)
        .enter()
        .append('circle')
        .attr('class', 'circle-chart')  
        .attr("r", '3.5')
        .attr("cx", function(d) { return x_c(+d.Anyo)})
        .attr("cy", function(d) { return y_c(+d.supervivientes_total.replace(',','.')); })
        .style('fill', 'transparent')
        .style("stroke", 'rgb(41, 101, 101)')
        .style('opacity', '0')
        .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');

            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '0.4';
            }
            this.style.opacity = '1';
            
            let data = +d.tasa;
            data = data.toFixed(1);

            //Texto
            let html = '<p class="chart__tooltip--title">' + d.Anyo + '</p>' + '<p class="chart__tooltip--text">Media ponderada: ' + numberWithCommas2(parseInt(d.supervivientes_total.replace('.',','))) + '</p>' +
            '<p class="chart__tooltip--text">Mujeres: ' + numberWithCommas2(parseInt(d.supervivientes_mujeres.replace('.',','))) + '</p>' + 
            '<p class="chart__tooltip--text">Hombres: ' + numberWithCommas2(parseInt(d.supervivientes_hombres.replace('.',','))) + '</p>';
            
            tooltip.html(html);

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);               
        })
        .on('mouseout', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');
            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '1';
            }
            //Quitamos el tooltip
            getOutTooltip(tooltip);                
        })
        .transition()
        .delay(function(d,i) { return i * (3000 / innerData.length - 1)})
        .style('opacity', '1');
}

document.getElementById('replay').addEventListener('click', function() {
    animateChart();
});

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});