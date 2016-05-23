import {Component} from '@angular/core';
import {RouterLink} from '@angular/router-deprecated';

import {SocialShareButtons} from '../../common/social_share_buttons/social-share-buttons.component.ts';

let tpl = require('./header.template.html');
let style = require('./header.css');

@Component({
  selector: 'header-first',
  template: tpl,
  styles: [style],
  directives: [RouterLink, SocialShareButtons]
})

export class HeaderFirstComponent {
}