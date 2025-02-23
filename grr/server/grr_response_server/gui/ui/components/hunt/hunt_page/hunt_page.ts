import {ChangeDetectionStrategy, Component, OnDestroy, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, map, startWith, take, takeUntil} from 'rxjs/operators';

import {ColorScheme} from '../../../components/flow_details/helpers/result_accordion';
import {getHuntTitle, Hunt, HuntState} from '../../../lib/models/hunt';
import {isNonNull, isNull} from '../../../lib/preconditions';
import {observeOnDestroy} from '../../../lib/reactive';
import {ConfigGlobalStore} from '../../../store/config_global_store';
import {HuntApprovalGlobalStore} from '../../../store/hunt_approval_global_store';
import {HuntPageGlobalStore} from '../../../store/hunt_page_global_store';
import {UserGlobalStore} from '../../../store/user_global_store';
import {ApprovalCard, ApprovalParams} from '../../approval_card/approval_card';

/**
 * Provides the new hunt creation page.
 */
@Component({
  templateUrl: './hunt_page.ng.html',
  styleUrls: ['./hunt_page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuntPage implements OnDestroy {
  readonly ngOnDestroy = observeOnDestroy(this);

  protected readonly colorScheme = ColorScheme;
  protected readonly HuntState = HuntState;
  protected readonly getHuntTitle = getHuntTitle;

  readonly hunt$: Observable<Hunt|null> =
      this.huntPageGlobalStore.selectedHunt$;

  @ViewChild('approvalCard', {static: false}) approvalCard?: ApprovalCard;
  private readonly approvalParams$ =
      new BehaviorSubject<ApprovalParams|null>(null);
  readonly latestApproval$ = this.huntApprovalGlobalStore.latestApproval$;
  readonly hideApprovalCardContentByDefault$ = this.latestApproval$.pipe(
      map(approval => isNull(approval)),
      // we are only interested in the first emission, as we don't want
      // the approval card content to be hidden dynamically, only by
      // default:
      take(1),
      startWith(true),
  );
  protected readonly hasAccess$ = this.huntApprovalGlobalStore.hasAccess$;
  protected readonly huntApprovalRoute$ =
      this.huntApprovalGlobalStore.huntApprovalRoute$;
  protected readonly huntApprovalRequired$ =
      this.userGlobalStore.currentUser$.pipe(
          map(user => user.huntApprovalRequired));

  private huntId = '';
  protected hideFlowArgs = true;

  protected readonly huntsOverviewRoute = ['/hunts'];

  constructor(
      private readonly activatedRoute: ActivatedRoute,
      private readonly router: Router,
      private readonly huntPageGlobalStore: HuntPageGlobalStore,
      private readonly huntApprovalGlobalStore: HuntApprovalGlobalStore,
      private readonly configGlobalStore: ConfigGlobalStore,
      private readonly userGlobalStore: UserGlobalStore,
      private readonly title: Title,
  ) {
    this.activatedRoute.paramMap
        .pipe(
            takeUntil(this.ngOnDestroy.triggered$),
            map(params => params.get('id')),
            filter(isNonNull),
            )
        .subscribe(huntId => {
          this.huntId = huntId;
          this.huntPageGlobalStore.selectHunt(huntId);
          this.huntApprovalGlobalStore.selectHunt(huntId);
        });

    combineLatest(
        [this.approvalParams$, this.huntPageGlobalStore.selectedHuntId$])
        .pipe(
            takeUntil(this.ngOnDestroy.triggered$),
            filter(
                ([approvalParams, huntId]) =>
                    isNonNull(approvalParams) && isNonNull(huntId)))
        .subscribe(
            ([approvalParams, huntId]) => {
              this.huntApprovalGlobalStore.requestHuntApproval({
                huntId: huntId!,
                approvers: approvalParams!.approvers,
                reason: approvalParams!.reason,
                cc: approvalParams!.cc,
              });
            },
        );

    this.huntPageGlobalStore.selectedHunt$
        .pipe(
            takeUntil(this.ngOnDestroy.triggered$),
            )
        .subscribe(hunt => {
          if (hunt) {
            const desc = getHuntTitle(hunt);
            const info = desc ? `${desc} (${hunt.huntId})` : hunt.huntId;
            this.title.setTitle(`GRR | ${info}`);
          } else {
            this.title.setTitle('GRR');
          }
        });
  }

  protected readonly flowDescriptor$ =
      combineLatest([
        this.hunt$.pipe(filter(isNonNull), map(hunt => hunt.flowName)),
        this.configGlobalStore.flowDescriptors$
      ])
          .pipe(
              map(([flowName, fds]) => {
                if (!flowName || !fds) {
                  return null;
                }
                return fds.get(flowName);
              }),
              startWith(null));

  requestHuntApproval(approvalParams: ApprovalParams) {
    this.approvalParams$.next(approvalParams);
  }

  cancelHunt() {
    this.huntPageGlobalStore.cancelHunt();
  }

  startHunt() {
    this.huntPageGlobalStore.startHunt();
  }

  copyHunt() {
    this.router.navigate(['/new-hunt'], {
      queryParams: {'huntId': this.huntId},
    });
  }

  toggleFlowArgs() {
    this.hideFlowArgs = !this.hideFlowArgs;
  }
}
