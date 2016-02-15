import { Component, OnInit } from 'angular2/core';
import {HeaderMainComponent} from './header/header.main.component';

let tpl = require('./main.component.html');
let style = require('./main.component.css');

@Component({
  selector: 'main',
  template: tpl,
  styles: [style],
  directives: [HeaderMainComponent]
})

export class MainComponent {

}