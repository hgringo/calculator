import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { CashError } from "../../types/VneCashMachineError";
import { Subscription } from "rxjs";
import { CashErrorService } from "../../services/error.service";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  standalone: true,
  selector: 'error-banner',
  templateUrl: './error-banner.html', 
  styleUrls: ['./error-banner.scss'],
  imports: [
    CommonModule, 
    DialogModule, 
    ButtonModule,
    TranslatePipe
  ]
})
export class ErrorBannerComponent implements OnInit, OnDestroy {

  errors: CashError[] = [];
  visible = false;
  private sub = new Subscription();

  constructor(private errorService: CashErrorService) {}

  ngOnInit() {
    this.sub.add(
      this.errorService.errors$.subscribe(errs => {
        this.errors = errs;
        this.visible = errs.length > 0;
      })
    );
  }

  remove(error: CashError) {
    this.errorService.remove(error.type);
  }

  clearAll() {
    this.errorService.clear();
    this.visible = false;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}