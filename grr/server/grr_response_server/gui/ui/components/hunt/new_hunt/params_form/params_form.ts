import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';

import {RolloutForm} from '../../../../components/hunt/rollout_form/rollout_form';
import {SafetyLimits} from '../../../../lib/models/hunt';
import {NewHuntLocalStore} from '../../../../store/new_hunt_local_store';


/**
 * Provides the forms for new hunt params configuration.
 */
@Component({
  selector: 'app-params-form',
  templateUrl: './params_form.ng.html',
  styleUrls: ['./params_form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NewHuntLocalStore],
})
export class ParamsForm implements AfterViewInit {
  @HostBinding('class.closed') hideContent = false;
  @ViewChild('rolloutForm', {static: false}) rolloutForm!: RolloutForm;

  hideAdvancedParams = true;

  readonly defaultSafetyLimits$: Observable<SafetyLimits|undefined> =
      this.newHuntLocalStore.safetyLimits$;

  readonly controls = {
    'expiryTime': new FormControl(BigInt(0), {nonNullable: true}),
    'crashLimit': new FormControl(BigInt(0), {nonNullable: true}),
    'avgResultsPerClientLimit': new FormControl(BigInt(0), {nonNullable: true}),
    'avgCpuSecondsPerClientLimit': new FormControl(
        BigInt(0), {nonNullable: true}),
    'avgNetworkBytesPerClientLimit': new FormControl(
        BigInt(0), {nonNullable: true}),
    'cpuLimit': new FormControl(BigInt(0), {nonNullable: true}),
    'networkBytesLimit': new FormControl(BigInt(0), {nonNullable: true}),
  };
  readonly form = new FormGroup(this.controls);

  constructor(
      private readonly changeDetection: ChangeDetectorRef,
      private readonly newHuntLocalStore: NewHuntLocalStore,
  ) {}

  ngAfterViewInit() {
    this.newHuntLocalStore.safetyLimits$.subscribe(safetyLimits => {
      this.setFormState(safetyLimits);
    });
  }

  @HostListener('click')
  onClick(event: Event) {
    this.showForm(event);
  }

  toggleForm(event: Event) {
    this.hideContent = !this.hideContent;
    event.stopPropagation();
  }

  showForm(event: Event) {
    if (this.hideContent) {
      this.hideContent = false;
      event.stopPropagation();
    }
  }

  toggleAdvancedParams() {
    this.hideAdvancedParams = !this.hideAdvancedParams;
  }

  setFormState(safetyLimits: SafetyLimits) {
    this.rolloutForm.setFormState(safetyLimits);
    this.form.setValue({
      'expiryTime': safetyLimits.expiryTime,
      'crashLimit': safetyLimits.crashLimit,
      'avgResultsPerClientLimit': safetyLimits.avgResultsPerClientLimit,
      'avgCpuSecondsPerClientLimit': safetyLimits.avgCpuSecondsPerClientLimit,
      'avgNetworkBytesPerClientLimit':
          safetyLimits.avgNetworkBytesPerClientLimit,
      'cpuLimit': safetyLimits.cpuLimit,
      'networkBytesLimit': safetyLimits.networkBytesLimit,
    });
    this.changeDetection.markForCheck();
  }

  buildSafetyLimits(): SafetyLimits {
    const partialLimits = this.rolloutForm.getPartialLimits();
    return {
      ...partialLimits,
      expiryTime: BigInt(this.form.get('expiryTime')!.value),
      crashLimit: BigInt(this.form.get('crashLimit')!.value),
      avgResultsPerClientLimit:
          BigInt(this.form.get('avgResultsPerClientLimit')!.value),
      avgCpuSecondsPerClientLimit:
          BigInt(this.form.get('avgCpuSecondsPerClientLimit')!.value),
      avgNetworkBytesPerClientLimit:
          BigInt(this.form.get('avgNetworkBytesPerClientLimit')!.value),
      cpuLimit: BigInt(this.form.get('cpuLimit')!.value),
      networkBytesLimit: BigInt(this.form.get('networkBytesLimit')!.value),
    };
  }
}