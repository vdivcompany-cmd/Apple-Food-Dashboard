import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'egpCurrency',
  standalone: true,
})
export class EgpCurrencyPipe implements PipeTransform {
  transform(value: number | string | undefined | null, showSymbol: boolean = true): string {
    if (value === undefined || value === null) return '0.00 EGP';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00 EGP';

    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return showSymbol ? `${formatted} EGP` : formatted;
  }
}
