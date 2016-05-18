import {Component, OnInit, Inject, ElementRef, NgZone, OnDestroy} from '@angular/core';
import {fromEvent} from 'rxjs/observable/fromEvent';

let tpl = require('./about.template.html');
let style = require('./about.css');

const proportion:number = 1.777;

@Component({
  selector: 'about',
  template: tpl,
  styles: [style]
})

export class AboutComponent implements OnInit, OnDestroy {
  private element:any;
  private videoContainer:HTMLElement;
  private videosIframes:any;
  private zone:NgZone;
  public resizeSubscribe:any;

  public constructor(@Inject(ElementRef) element, @Inject(NgZone) zone) {
    this.element = element.nativeElement;
    this.zone = zone;
  }

  public ngOnInit() {
    this.videosIframes = this.element.querySelectorAll('.video-container iframe');

    this.setVideosSize();

    this.resizeSubscribe = fromEvent(window, 'resize')
      .debounceTime(150)
      .subscribe(() => {
        this.zone.run(() => {
          this.setVideosSize();
        });
      });
  }

  public ngOnDestroy() {
    this.resizeSubscribe.unsubscribe();
  }

  setVideosSize() {
    if (!this.videosIframes || !this.videosIframes.length) {
      return;
    }

    this.videoContainer = this.element.querySelector('.video-container');

    let videoContainerWidth = this.videoContainer.offsetWidth;
    let videoWidth = (videoContainerWidth - 20) / 2;
    let videoHeigth = videoWidth / proportion;

    for (let i = 0; i < this.videosIframes.length; i++) {
      this.videosIframes[i].style.width = videoWidth + 'px';
      this.videosIframes[i].style.height = videoHeigth + 'px';
    }
  }
}
