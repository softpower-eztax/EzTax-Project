/**
 * 숫자를 일관된 형식으로 포맷팅하는 유틸리티 함수들
 */

/**
 * 숫자를 소수점 2자리까지 표시하고 천단위 구분자를 추가
 * @param value 포맷팅할 숫자
 * @param options 포맷팅 옵션
 */
export function formatCurrency(value: number | string, options: {
  decimals?: number;
  showCommas?: boolean;
  prefix?: string;
} = {}): string {
  const {
    decimals = 2,
    showCommas = true,
    prefix = '$'
  } = options;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${prefix}0.00`;
  }

  // 소수점 자리수 제한
  const rounded = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  let formatted = rounded.toFixed(decimals);
  
  if (showCommas) {
    // 천단위 구분자 추가
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');
  }
  
  return `${prefix}${formatted}`;
}

/**
 * 숫자만 표시 (달러 기호 없이)
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00';
  }

  // 소수점 자리수 제한
  const rounded = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded.toFixed(decimals);
}

/**
 * 퍼센트 표시
 */
export function formatPercent(value: number | string, decimals: number = 1): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.0%';
  }

  const rounded = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${rounded.toFixed(decimals)}%`;
}

/**
 * 입력 필드에서 사용할 숫자 값 (소수점 2자리로 제한하되 표시는 깔끔하게)
 */
export function formatInputNumber(value: number | string): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 0;
  }

  // 소수점 2자리로 반올림
  return Math.round(numValue * 100) / 100;
}