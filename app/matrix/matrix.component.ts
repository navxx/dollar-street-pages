import {Component, OnInit, Inject, ElementRef, OnDestroy} from '@angular/core';
import {RouteParams} from '@angular/router-deprecated';
import {Subject} from 'rxjs/Subject';

import {MatrixImagesComponent} from './matrix-images/matrix-images.component';
import {StreetComponent} from '../common/street/street.component';
import {FooterComponent} from '../common/footer/footer.component';
import {HeaderComponent} from '../common/header/header.component';
import {LoaderComponent} from '../common/loader/loader.component';

let _ = require('lodash');
let device = require('device.js')();

let tpl = require('./matrix.template.html');
let style = require('./matrix.css');

@Component({
  selector: 'matrix',
  template: tpl,
  styles: [style],
  directives: [MatrixImagesComponent, HeaderComponent, StreetComponent, FooterComponent, LoaderComponent]
})

export class MatrixComponent implements OnInit, OnDestroy {
  public query:string;
  public matrixService:any;
  public streetPlaces:Subject<any> = new Subject();
  public matrixPlaces:Subject<any> = new Subject();
  public chosenPlaces:Subject<any> = new Subject();
  public hoverPlace:Subject<any> = new Subject();
  public padding:Subject<any> = new Subject();
  // public hoverHeader:Subject<any> = new Subject();
  private placesArr:any[];
  private element:HTMLElement;

  private rowEtalon:number = 0;

  private imageHeight:number;
  private footerHeight:number;
  private imageMargin:number;
  private visiblePlaces:number;

  private urlChangeService:any;
  private routeParams:RouteParams;
  private thing:string;
  private countries:string;
  private regions:string;
  private row:number;
  private placesVal:any;
  private zoom:number;
  private isDesktop:boolean = device.desktop();
  private clonePlaces:any[];
  private filtredPlaces:any[];
  public loader:boolean = false;
  public isDraw:boolean = false;
  public filter:any;
  public matrixServiceSubscrib:any;

  public constructor(@Inject('MatrixService') matrixService,
                     @Inject(ElementRef) element,
                     @Inject('UrlChangeService') urlChangeService,
                     @Inject(RouteParams) routeParams) {
    this.matrixService = matrixService;
    this.element = element.nativeElement;
    this.routeParams = routeParams;
    this.urlChangeService = urlChangeService;
  }

  public ngOnInit():void {
    this.thing = this.routeParams.get('thing');
    this.countries = this.routeParams.get('countries') ? decodeURI(this.routeParams.get('countries')) : 'World';
    this.regions = this.routeParams.get('regions');
    //todo: row void 0
    this.row = parseInt(this.routeParams.get('row'), 10);
    this.zoom = parseInt(this.routeParams.get('zoom'), 10);

    if (this.isDesktop && (!this.zoom || this.zoom < 2 || this.zoom > 10)) {
      this.zoom = 5;
    }

    if (!this.isDesktop && (!this.zoom || this.zoom < 2 || this.zoom > 3)) {
      this.zoom = 3;
    }
    this.thing = this.thing ? this.thing : '5477537786deda0b00d43be5';
    this.zoom = this.zoom ? this.zoom : 5;
    this.row = this.row ? this.row : 1;
    this.regions = this.regions ? this.regions : 'World';

    this.query = `thing=${this.thing}&countries=${this.countries}&regions=${this.regions}&zoom=${this.zoom}&row=${this.row}`;

    document.onscroll = () => {
      this.stopScroll();
    };
  }

  public ngOnDestroy() {
    document.onscroll = void 0;
    this.matrixServiceSubscrib.unsubscribe();
  }

  ngAfterViewChecked() {
    let footer = this.element.querySelector('.footer') as HTMLElement;
    let imgContent = this.element.querySelector('.image-content') as HTMLElement;
    if (this.footerHeight === footer.offsetHeight &&
      this.imageHeight === imgContent.offsetHeight || !this.element.querySelector('.image-content')) {
      return;
    }
    this.imageHeight = imgContent.offsetHeight;
    this.footerHeight = footer.offsetHeight;
    this.getPaddings();
  }

  stopScroll() {
    /**  each document usage breaks possible server side rendering*/
    let scrollTop = document.body.scrollTop; //? body.scrollTop : ieScrollBody.scrollTop;
    let distance = scrollTop / (this.imageHeight + 2 * this.imageMargin);

    if (isNaN(distance)) {
      return;
    }

    let rest = distance % 1;
    let row = distance - rest;

    if (rest >= 0.65) {
      row++;
    }

    this.row = row + 1;

    if (this.rowEtalon !== this.row) {
      this.rowEtalon = this.row;
      let query = `${this.query.replace(/row\=\d*/, `row=${this.row}`)}`;

      this.urlChangeService.replaceState(`/matrix`, query);
    }

    let clonePlaces = _.cloneDeep(this.filtredPlaces);
    if (clonePlaces && clonePlaces.length && this.visiblePlaces) {
      this.chosenPlaces.next(clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * this.visiblePlaces));
    }
  }

  getPaddings() {
    let windowInnerWidth = window.innerWidth;
    let header = this.element.querySelector('.matrix-header') as HTMLElement;
    this.imageMargin = (windowInnerWidth - this.imageHeight * this.zoom) / (2 * this.zoom);

    let bottomPadding = window.innerHeight - header.offsetHeight - this.footerHeight - this.imageHeight
      - 2 * (windowInnerWidth - this.imageHeight * this.zoom) / (2 * this.zoom);

    if (bottomPadding <= 0) {
      bottomPadding = 0;
    }

    /**use content\view child\childer*/

    let matrixImages = this.element.querySelector('matrix-images') as HTMLElement;
    let imagesContainer = this.element.querySelector('.images-container') as HTMLElement;
    let imageContainer = this.element.querySelector('.image-content') as HTMLElement;

    matrixImages.style.paddingTop = `${header.offsetHeight}px`;
    imagesContainer.style.paddingBottom = `${bottomPadding}px`;

    this.getViewableRows(header.offsetHeight);

    document.querySelector('body').scrollTop = (this.row - 1) * (imageContainer.offsetHeight + 2 * this.imageMargin);
    if (this.clonePlaces) {
      console.log('paddings')
      this.streetPlaces.next(this.placesVal);
      this.chosenPlaces.next(this.clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * (this.visiblePlaces || 1)));
    }
  }

  getViewableRows(headerHeight:number):void {
    let windowInnerHeight = window.innerHeight;
    let viewable = windowInnerHeight - headerHeight;
    let distance = viewable / (this.imageHeight + 2 * this.imageMargin);
    let rest = distance % 1;
    let row = distance - rest;
    if (rest >= 0.65) {
      row++;
    }

    this.visiblePlaces = row;

    this.clonePlaces = _.cloneDeep(this.filtredPlaces);
  }

  hoverPlaceS(place) {
    this.hoverPlace.next(place);
  }

  urlChanged(options):void {
    /**to remove things like this*/
    let {query, search} = options;
    this.query = query;
    let parseQuery = this.parseUrl(this.query);
    this.thing = parseQuery.thing;
    this.urlChangeService.replaceState(`/matrix`, `${query}`);

    if (this.matrixServiceSubscrib) {
      this.matrixServiceSubscrib.unsubscribe();
      this.matrixServiceSubscrib = void 0;
    }
    this.filter.lowIncome=void 0;
    this.filter.hightIncome=void 0;
    this.matrixServiceSubscrib = this.matrixService.getMatrixImages(query)
      .subscribe((val) => {
        if (val.err) {
          console.log(val.err);
          return;
        }
        this.placesVal = val.places;
        this.filtredPlaces = this.placesVal.filter((place:any):boolean=> {
          if (!place) {
            return void 0;
          }
          let low = this.filter.lowIncome ? this.filter.lowIncome : 0;
          let upper = this.filter.hightIncome ? this.filter.hightIncome : 20000;
          return place.income >= low && place.income <= upper;
        });

        this.matrixPlaces.next(this.filtredPlaces);
        this.placesArr = val.places;
        this.clonePlaces = _.cloneDeep(this.filtredPlaces);
        // if (search) {
        //   console.log('search')
        //   this.streetPlaces.next(this.placesVal);
        //   this.chosenPlaces.next(this.clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * (this.visiblePlaces || 1)));
        // }
        this.zoom = +parseQuery.zoom;
        this.loader = true;
      });
  }

  filterStreet(filter) {
    this.filter = filter;
    if (!this.placesVal) {
      return;
    }
    this.filtredPlaces = this.placesVal.filter((place:any):boolean=> {
      if (!place) {
        return void 0;
      }
      let low = filter.lowIncome ? filter.lowIncome : 0;
      let upper = filter.hightIncome ? filter.hightIncome : 20000;
      return place.income >= low && place.income <= upper;
    });
    this.matrixPlaces.next(this.filtredPlaces);
    this.clonePlaces = _.cloneDeep(this.filtredPlaces);
    this.chosenPlaces.next(this.clonePlaces .splice((this.row - 1) * this.zoom, this.zoom * (this.visiblePlaces || 1)));
  }


  changeZoom(zoom) {
    this.urlChanged({query: this.query.replace(/zoom\=\d*/, `zoom=${zoom}`).replace(/row\=\d*/, `row=${this.row}`)});
  };

  parseUrl(url:string):any {
    url = '{\"' + url.replace(/&/g, '\",\"') + '\"}';
    url = url.replace(/=/g, '\":\"');

    return JSON.parse(url);
  }
}
