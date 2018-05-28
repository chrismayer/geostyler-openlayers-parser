import * as ol from 'openlayers';
import {
  Style,
  StyleParser,
  Rule,
  Symbolizer,
  CircleSymbolizer,
  LineSymbolizer,
  FillSymbolizer,
  TextSymbolizer,
  StyleType,
  PointSymbolizer,
  ComparisonFilter,
  Filter
} from 'geostyler-style';
import OlStyleUtil from './Util/OlStyleUtil';
import { isNumber } from 'util';

/**
 * This parser can be used with the GeoStyler.
 * It implements the GeoStyler-Style Parser interface to work with OpenLayers styles.
 *
 * @class OlStyleParser
 * @implements StyleParser
 */
class OlStyleParser implements StyleParser {

  /**
   * Get the GeoStyler-Style PointSymbolizer from an OpenLayers Style object.
   *
   * @param {object} olStyle The OpenLayers Style object
   * @return {PointSymbolizer} The GeoStyler-Style PointSymbolizer
   */
  getPointSymbolizerFromOlStyle(olStyle: ol.style.Style): PointSymbolizer {
    const olCircleStyle = olStyle.getImage() as ol.style.Circle;
    const olFillStyle = olCircleStyle.getFill();
    const olStrokeStyle = olCircleStyle.getStroke();

    return {
      kind: 'Circle',
      color: olFillStyle ? OlStyleUtil.getHexColor(olFillStyle.getColor() as string) : undefined,
      opacity: olFillStyle ? OlStyleUtil.getOpacity(olFillStyle.getColor() as string) : undefined,
      radius: isNumber(olCircleStyle.getRadius()) ? olCircleStyle.getRadius() : 5,
      strokeColor: olStrokeStyle ? olStrokeStyle.getColor() as string : undefined,
      strokeOpacity: olStrokeStyle ? OlStyleUtil.getOpacity(olStrokeStyle.getColor() as string) : undefined,
      strokeWidth: olStrokeStyle ? olStrokeStyle.getWidth() : undefined
    };
  }

  /**
   * Get the GeoStyler-Style LineSymbolizer from an OpenLayers Style object.
   *
   * @param {object} olStyle The OpenLayers Style object
   * @return {LineSymbolizer} The GeoStyler-Style LineSymbolizer
   */
  getLineSymbolizerFromOlStyle(olStyle: ol.style.Style): LineSymbolizer {
    const olStrokeStyle = olStyle.getStroke() as ol.style.Stroke;

    return {
      kind: 'Line',
      color: olStrokeStyle ? OlStyleUtil.getHexColor(olStrokeStyle.getColor() as string) as string : undefined,
      opacity: olStrokeStyle ? OlStyleUtil.getOpacity(olStrokeStyle.getColor() as string) : undefined,
      width: olStrokeStyle ? olStrokeStyle.getWidth() : undefined
    };
  }

  /**
   * Get the GeoStyler-Style FillSymbolizer from an OpenLayers Style object.
   *
   * PolygonSymbolizer Stroke is just partially supported.
   *
   * @param {ol.style.Style} olStyle The OpenLayers Style object
   * @return {FillSymbolizer} The GeoStyler-Style FillSymbolizer
   */
  getFillSymbolizerFromOlStyle(olStyle: ol.style.Style): FillSymbolizer {
    const olFillStyle = olStyle.getFill() as ol.style.Fill;
    const olStrokeStyle = olStyle.getStroke() as ol.style.Stroke;

    return {
      kind: 'Fill',
      color: olFillStyle ? OlStyleUtil.getHexColor(olFillStyle.getColor() as string) : undefined,
      opacity: olFillStyle ? OlStyleUtil.getOpacity(olFillStyle.getColor() as string) : undefined,
      outlineColor: olStrokeStyle ? olStrokeStyle.getColor() as string : undefined
    };
  }

  /**
   * Get the GeoStyler-Style Symbolizer from an OpenLayers Style object.
   *
   * Currently only one symbolizer per rule is supported.
   *
   * @param {ol.style.Style} olStyle The OpenLayers Style object
   * @return {Symbolizer} The GeoStyler-Style Symbolizer
   */
  getSymbolizerFromOlStyle(olStyle: ol.style.Style): Symbolizer {
    let symbolizer: Symbolizer = <Symbolizer> {};
    const symbType = this.getStyleTypeFromOlStyle(olStyle);

    switch (symbType) {
      case 'Point':
        symbolizer = this.getPointSymbolizerFromOlStyle(olStyle);
        break;
      case 'Line':
        symbolizer = this.getLineSymbolizerFromOlStyle(olStyle);
        break;
      // case 'TextSymbolizer':
      //   symbolizer = this.getTextSymbolizerFromOlStyle(olStyle);
      //   break;
      case 'Fill':
        symbolizer = this.getFillSymbolizerFromOlStyle(olStyle);
        break;
      default:
        throw new Error('Failed to parse SymbolizerKind from OpenLayers Style');
    }

    return symbolizer;
  }

  /**
   * Get the GeoStyler-Style Rule from an OpenLayers Style object.
   *
   * Currently only one symbolizer per rule is supported.
   *
   * @param {ol.style.Style} olStyle The OpenLayers Style object
   * @return {Rule} The GeoStyler-Style Rule
   */
  getRulesFromOlStyle(olStyle: ol.style.Style): Rule[] {
    const symbolizer: Symbolizer = this.getSymbolizerFromOlStyle(olStyle);
    let rule = {
      symbolizer
    };
    let rules: Rule[] = [rule];

    return rules;
  }

  /**
   * Get the GeoStyler-Style Symbolizer from an OpenLayers Style object.
   *
   * @param {ol.style.Style} olStyle The OpenLayers Style object
   * @return {Symbolizer} The GeoStyler-Style Symbolizer
   */
  getStyleTypeFromOlStyle(olStyle: ol.style.Style): StyleType {
    let styleType: StyleType;

    if (olStyle.getImage() instanceof ol.style.Image) {
      styleType = 'Point';
    } else if (olStyle.getFill() instanceof ol.style.Fill) {
      styleType = 'Fill';
    } else if (olStyle.getStroke() && !olStyle.getFill()) {
      styleType = 'Line';
    } else {
      throw new Error('StyleType could not be detected');
    }

    return styleType;
  }

  /**
   * Get the GeoStyler-Style Style from an OpenLayers Style object.
   *
   * @param {object} olStyle The OpenLayers Style object
   * @return {Style} The GeoStyler-Style Style
   */
  olStyleToGeoStylerStyle(olStyle: ol.style.Style): Style {
    const type = this.getStyleTypeFromOlStyle(olStyle);
    const rules = this.getRulesFromOlStyle(olStyle);
    return {
      type,
      rules
    };
  }

  /**
   * The readStyle implementation of the GeoStyler-Style StyleParser interface.
   * It reads an OpenLayers style instance and returns a Promise.
   * The Promise itself resolves with a GeoStyler-Style Style.
   *
   * @param {string} olStyle An OpenLayers style instance
   * @return {Promise} The Promise resolving with the GeoStyler-Style Style
   */
  readStyle(olStyle: ol.style.Style): Promise<Style> {
    return new Promise<Style>((resolve, reject) => {
      try {

        const geoStylerStyle: Style = this.olStyleToGeoStylerStyle(olStyle);
        resolve(geoStylerStyle);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * The writeStyle implementation of the GeoStyler-Style StyleParser interface.
   * It reads a GeoStyler-Style Style and returns a Promise.
   * The Promise itself resolves with an OpenLayers style object.
   *
   * @param {Style} geoStylerStyle A GeoStyler-Style Style.
   * @return {Promise} The Promise resolving with an OpenLayers style instance.
   */
  writeStyle(geoStylerStyle: Style): Promise<ol.style.Style[]> {
    return new Promise<any>((resolve, reject) => {
      try {

        const olStyles = this.geoStylerStyleToOlStyle(geoStylerStyle);
        resolve(olStyles);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get the OpenLayers Style object from an GeoStyler-Style Style
   *
   * @param {Style} geoStylerStyle A GeoStyler-Style Style.
   * @return {ol.style.Style} An OpenLayers style instance
   */
  geoStylerStyleToOlStyle(geoStylerStyle: Style): any {

    const rules = geoStylerStyle.rules;
    let symbArr: any[] = [];

    rules.forEach((rule: Rule) => {

      const olStyle = this.getOlSymbolizerFromSymbolizer(rule.symbolizer) as ol.style.Style;

      // if we have a filter we have to wrap the Style as StyleFunction
      if (rule.filter) {
        // get the filter expressiona as stringified JS string
        const olFilterStr = this.getOlFilterFromFilter(rule.filter);

        // wrap filter expression in a StyleFunction
        const olFilterFn = (feature: ol.Feature, res: number): ol.style.Style | ol.style.Style[] | undefined => {

          // excecute the filter expression
          // tslint:disable-next-line:no-eval
          if (eval(olFilterStr)) {
            return olStyle;
          } else {
            return undefined;
          }
        };

        symbArr.push(olFilterFn);

      } else {
        symbArr.push(olStyle);
      }

    });

    return symbArr;
  }

  /**
   * Get the OpenLayers Style object or an OL StyleFunction from an
   * GeoStyler-Style Symbolizer.
   *
   * @param {Symbolizer} symbolizer A GeoStyler-Style Symbolizer.
   * @return {object} The OpenLayers Style object or a StyleFunction
   */
  getOlSymbolizerFromSymbolizer(symbolizer: Symbolizer): ol.style.Style | ol.StyleFunction {
    let olSymbolizer: ol.style.Style | ol.StyleFunction;
    switch (symbolizer.kind) {
      case 'Circle':
        olSymbolizer = this.getOlPointSymbolizerFromCircleSymbolizer(symbolizer);
        break;
      // case 'Icon':
      //   // TODO Implement logic for IconSymbolizer parsing
      //   // sldSymbolizer = this.getSldPointSymbolizerFromIconSymbolizer(symbolizer);
      //   break;
      case 'Text':
        olSymbolizer = this.getOlTextSymbolizerFromTextSymbolizer(symbolizer);
        break;
      case 'Line':
        olSymbolizer = this.getOlLineSymbolizerFromLineSymbolizer(symbolizer);
        break;
      case 'Fill':
        olSymbolizer = this.getOlPolygonSymbolizerFromFillSymbolizer(symbolizer);
        break;
      default:
        // Return the OL default style since the TS type binding does not allow
        // us to set olSymbolizer to undefined
        var fill = new ol.style.Fill({
          color: 'rgba(255,255,255,0.4)'
        });
        var stroke = new ol.style.Stroke({
          color: '#3399CC',
          width: 1.25
        });
        olSymbolizer = new ol.style.Style({
          image: new ol.style.Circle({
            fill: fill,
            stroke: stroke,
            radius: 5
          }),
          fill: fill,
          stroke: stroke
        });
        break;
    }
    return olSymbolizer;
  }

  /**
   * Get the OL Style object  from an GeoStyler-Style CircleSymbolizer.
   *
   * @param {CircleSymbolizer} circleSymbolizer A GeoStyler-Style CircleSymbolizer.
   * @return {object} The OL Style object
   */
  getOlPointSymbolizerFromCircleSymbolizer(symbolizer: CircleSymbolizer): ol.style.Style {
    let stroke;
    if (symbolizer.strokeColor) {
      stroke = new ol.style.Stroke({
        color: symbolizer.strokeColor,
        width: symbolizer.strokeWidth
      });
    }

    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: symbolizer.radius || 5,
        fill: new ol.style.Fill({
          color: (symbolizer.color && symbolizer.opacity) ?
            OlStyleUtil.getRgbaColor(symbolizer.color, symbolizer.opacity) : symbolizer.color
        }),
        stroke: stroke
      })
    });
  }

  /**
   * Get the OL Style object from an GeoStyler-Style LineSymbolizer.
   *
   * @param {LineSymbolizer} lineSymbolizer A GeoStyler-Style LineSymbolizer.
   * @return {object} The OL Style object
   */
  getOlLineSymbolizerFromLineSymbolizer(symbolizer: LineSymbolizer) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: (symbolizer.color && symbolizer.opacity) ?
          OlStyleUtil.getRgbaColor(symbolizer.color, symbolizer.opacity) : symbolizer.color,
        width: symbolizer.width
      })
    });
  }

  /**
   * Get the OL Style object from an GeoStyler-Style FillSymbolizer.
   *
   * @param {FillSymbolizer} fillSymbolizer A GeoStyler-Style FillSymbolizer.
   * @return {object} The OL Style object
   */
  getOlPolygonSymbolizerFromFillSymbolizer(symbolizer: FillSymbolizer) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: symbolizer.outlineColor
      }),
      fill: new ol.style.Fill({
        color: (symbolizer.color && symbolizer.opacity) ?
          OlStyleUtil.getRgbaColor(symbolizer.color, symbolizer.opacity) : symbolizer.color
      })
    });
  }

  /**
   * Get the OL StyleFunction object from an GeoStyler-Style TextSymbolizer.
   *
   * @param {TextSymbolizer} textSymbolizer A GeoStyler-Style TextSymbolizer.
   * @return {object} The OL StyleFunction
   */
  getOlTextSymbolizerFromTextSymbolizer(symbolizer: TextSymbolizer): ol.StyleFunction {

    const olPointStyledLabelFn = (feature: ol.Feature, res: number) => {

      const text = new ol.style.Text({
        font: OlStyleUtil.getTextFont(symbolizer),
        text: feature.get(symbolizer.field || ''),
        fill: new ol.style.Fill({
          color: (symbolizer.color && symbolizer.opacity) ?
            OlStyleUtil.getRgbaColor(symbolizer.color, symbolizer.opacity) : symbolizer.color
        }),
        stroke: new ol.style.Stroke({
          color: (symbolizer.color && symbolizer.opacity) ?
            OlStyleUtil.getRgbaColor(symbolizer.color, symbolizer.opacity) : symbolizer.color
        }),
        offsetX: symbolizer.offset ? symbolizer.offset[0] : 0,
        offsetY: symbolizer.offset ? symbolizer.offset[1] : 0,
        // TODO check why props match
        // textAlign: symbolizer.pitchAlignment,
        // textBaseline: symbolizer.anchor
      });

      const style = new ol.style.Style({
        text: text
      });

      return style;
    };

    return olPointStyledLabelFn;
  }

  /**
   * Get the OL compliant filter as a stringified JavaScript statement from a
   * GeoStyler-Style ComparisonFilter, like
   *
   * 'feature.get("NAME") == "New York"'
   *
   * @param {ComparisonFilter} comparisonFilter A GeoStyler-Style ComparisonFilter.
   * @return {object} The OL compliant filter a stringified JavaScript statement
   */
  getOlComparisonFilterFromComparisonFilter(comparisonFilter: ComparisonFilter): any {
    const operator = comparisonFilter[0];
    const key = comparisonFilter[1];
    const value = comparisonFilter[2];

    const filterStr = 'feature.get("' + key + '") ' + operator + ' "' + value + '"';

    return filterStr;
  }

  /**
   * Get a OL compliant filter as a stringified JavaScript statement.
   *
   * @param {Filter} filter A GeoStyler-Style Filter.
   * @return {object} The OL compliant filter a stringified JavaScript statement
   */
  getOlFilterFromFilter(filter: Filter): string {

    const comparisonMap = {
      PropertyIsEqualTo: '==',
      PropertyIsNotEqualTo: '!=',
      PropertyIsLike: '*=',
      PropertyIsLessThan: '<',
      PropertyIsLessThanOrEqualTo: '<=',
      PropertyIsGreaterThan: '>',
      PropertyIsGreaterThanOrEqualTo: '>=',
      PropertyIsNull: '=='
    };
    const negationOperatorMap = {
      Not: '!'
    };
    const combinationMap = {
      And: '&&',
      Or: '||',
      PropertyIsBetween: '&&'
    };

    let olFilterStr = '';
    const [
      operator,
      ...args
    ] = <Array<any>> filter;

    if (Object.values(comparisonMap).includes(operator)) {
      // add the JS comparison filter as string, like 'feature.get("NAME") == "New York"'
      olFilterStr += this.getOlComparisonFilterFromComparisonFilter(filter as ComparisonFilter);

    } else if (Object.values(combinationMap).includes(operator)) {
      const combinator = operator;

      // add sub filters and combine by combinator oprator (&& / ||)
      args.forEach((subFilter, idx) => {
        let subFilterStr = this.getOlFilterFromFilter(subFilter);
        olFilterStr += subFilterStr;

        if (idx < args.length - 1) {
          olFilterStr += ' ' + combinator + ' ';
        }
      });

    } else if (Object.values(negationOperatorMap).includes(operator)) {
      const negOperator = operator;

      // add sub filters and wrap by !(...)
      olFilterStr += negOperator + '( ';
      args.forEach((subFilter, idx) => {
        let subFilterStr = this.getOlFilterFromFilter(subFilter);
        olFilterStr += subFilterStr;
      });
      olFilterStr += ' )';
    }

    return olFilterStr;
  }

}

export default OlStyleParser;
