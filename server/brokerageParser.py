#!/usr/bin/env python3
"""
증권사별 1099-B PDF 파싱 시스템
각 증권사의 고유한 PDF 형식에 맞춘 전용 파서
"""

import re
import sys
import json
import pdfplumber
from typing import Dict, List, Any, Optional

def parse_currency(text: str) -> float:
    """통화 문자열을 float로 변환"""
    if not text or text.strip() == '':
        return 0.0
    
    # 음수 처리 (괄호 또는 마이너스)
    is_negative = '(' in text and ')' in text
    text = re.sub(r'[^\d.,\-]', '', text)
    
    if text.endswith('.'):
        text = text[:-1]
    
    try:
        value = float(text.replace(',', ''))
        return -abs(value) if is_negative else value
    except:
        return 0.0

def detect_brokerage(text: str) -> str:
    """PDF 텍스트에서 증권사 식별"""
    text_lower = text.lower()
    
    if 'robinhood' in text_lower:
        return 'robinhood'
    elif 'interactive brokers' in text_lower or 'ibkr' in text_lower:
        return 'interactive_brokers'
    elif 'td ameritrade' in text_lower or 'schwab' in text_lower:
        return 'schwab_td'
    elif 'fidelity' in text_lower:
        return 'fidelity'
    elif 'e*trade' in text_lower or 'etrade' in text_lower:
        return 'etrade'
    else:
        return 'unknown'

def parse_robinhood_pdf(text: str) -> Dict[str, Any]:
    """Robinhood 1099-B PDF 파싱 (Schedule D Summary 형식)"""
    print("Robinhood 파싱 시작", file=sys.stderr)
    
    # Schedule D Summary 패턴 (5개 숫자: Proceeds, Cost, Market Discount, Wash Sale, Net Gain)
    summary_patterns = [
        r'Grand total\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        r'Grandtotal\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        r'Total Short-term\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})'
    ]
    
    for pattern in summary_patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            proceeds = parse_currency(match.group(1))
            cost_basis = parse_currency(match.group(2))
            market_discount = parse_currency(match.group(3))
            wash_sale = parse_currency(match.group(4))
            net_gain = parse_currency(match.group(5))
            
            print(f"Robinhood Schedule D Summary: Proceeds={proceeds}, Cost={cost_basis}, Wash={wash_sale}, Net={net_gain}", file=sys.stderr)
            
            return {
                "totalProceeds": proceeds,
                "totalCostBasis": cost_basis,
                "totalNetGainLoss": net_gain,
                "totalWashSaleLoss": wash_sale,
                "shortTermProceeds": proceeds,
                "shortTermCostBasis": cost_basis,
                "shortTermNetGainLoss": net_gain,
                "longTermProceeds": 0,
                "longTermCostBasis": 0,
                "longTermNetGainLoss": 0,
                "transactions": [{
                    "cusip": "",
                    "description": "Short-term Capital Gains Summary (총 Multiple 거래)",
                    "dateAcquired": "Various",
                    "dateSold": "Various",
                    "proceeds": proceeds,
                    "costBasis": cost_basis,
                    "washSaleLoss": wash_sale,
                    "netGainLoss": net_gain,
                    "quantity": 1,
                    "isLongTerm": False,
                    "formType": "A"
                }]
            }
    
    print("Robinhood Schedule D Summary 패턴을 찾지 못했습니다", file=sys.stderr)
    return None

def parse_interactive_brokers_pdf(text: str) -> Optional[Dict[str, Any]]:
    """Interactive Brokers 1099-B PDF 파싱 (개별 거래 형식)"""
    print("Interactive Brokers 파싱 시작", file=sys.stderr)
    
    # 디버깅: 텍스트에서 숫자 패턴이 있는 라인들 찾기
    lines = text.split('\n')
    number_pattern = r'[\d,]+\.\d{2}'
    
    print("숫자 패턴 라인들 분석:", file=sys.stderr)
    for i, line in enumerate(lines[:50]):  # 처음 50라인만 확인
        if line.strip():
            numbers = re.findall(number_pattern, line)
            if len(numbers) >= 3:  # 3개 이상의 숫자가 있는 라인
                print(f"라인 {i}: {line.strip()}", file=sys.stderr)
                print(f"  숫자들: {numbers}", file=sys.stderr)
    
    transactions = []
    total_proceeds = 0
    total_cost_basis = 0
    total_wash_sale = 0
    total_net_gain = 0
    
    # 더 간단하고 유연한 패턴들로 시작
    patterns = [
        # 패턴 1: 4개 숫자 연속 (가장 간단)
        r'([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        # 패턴 2: 회사명 + 숫자들
        r'([A-Z\s&\.]+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        # 패턴 3: 전체 IBKR 라인 (원래 패턴)
        r'([A-Z\s&\.]+?)\s+(\d+)\s+([A-Z]+)\s+(\d+)\s+([AB])\s+(SALE|PURCHASE)\s+(\d{1,2}/\d{1,2}/\d{4})\s+(\d{1,2}/\d{1,2}/\d{4}|\w+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})'
    ]
    
    for pattern_idx, pattern in enumerate(patterns):
        print(f"패턴 {pattern_idx + 1} 테스트 중...", file=sys.stderr)
        
        for line_idx, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            match = re.search(pattern, line)
            if match:
                try:
                    groups = match.groups()
                    print(f"패턴 {pattern_idx + 1} 매치 발견 (라인 {line_idx}): {line}", file=sys.stderr)
                    print(f"  그룹들: {groups}", file=sys.stderr)
                    
                    # 패턴에 따라 다른 파싱 로직
                    if pattern_idx == 0:  # 4개 숫자만
                        proceeds = parse_currency(groups[0])
                        cost_basis = parse_currency(groups[1])
                        market_discount = parse_currency(groups[2])
                        wash_sale = parse_currency(groups[3])
                        net_gain = proceeds - cost_basis
                        
                        # 기본값 설정
                        company_name = f"Transaction {len(transactions) + 1}"
                        cusip = "Unknown"
                        symbol = "Unknown"
                        quantity = 1
                        form_type = "A"
                        action = "SALE"
                        date_sold = "Various"
                        date_acquired = "Various"
                        
                    elif pattern_idx == 1:  # 회사명 + 4개 숫자
                        company_name = groups[0].strip()
                        proceeds = parse_currency(groups[1])
                        cost_basis = parse_currency(groups[2])
                        market_discount = parse_currency(groups[3])
                        wash_sale = parse_currency(groups[4])
                        net_gain = proceeds - cost_basis
                        
                        # 기본값 설정
                        cusip = "Unknown"
                        symbol = company_name.split()[0] if company_name else "Unknown"
                        quantity = 1
                        form_type = "A"
                        action = "SALE"
                        date_sold = "Various"
                        date_acquired = "Various"
                        
                    else:  # 전체 패턴
                        company_name = groups[0].strip()
                        cusip = groups[1]
                        symbol = groups[2]
                        quantity = int(groups[3])
                        form_type = groups[4]
                        action = groups[5]
                        date_sold = groups[6]
                        date_acquired = groups[7]
                        proceeds = parse_currency(groups[8])
                        cost_basis = parse_currency(groups[9])
                        market_discount = parse_currency(groups[10])
                        wash_sale = parse_currency(groups[11])
                        net_gain = proceeds - cost_basis
                    
                    print(f"파싱 결과: {symbol} P={proceeds} C={cost_basis} W={wash_sale} N={net_gain}", file=sys.stderr)
                    
                    transactions.append({
                        "cusip": cusip,
                        "description": f"{company_name} {cusip} {symbol} {quantity} {form_type} {action} {date_sold} {date_acquired} {proceeds} {cost_basis} {market_discount} {wash_sale}",
                        "dateAcquired": date_acquired,
                        "dateSold": date_sold,
                        "proceeds": proceeds,
                        "costBasis": cost_basis,
                        "washSaleLoss": wash_sale,
                        "netGainLoss": net_gain,
                        "quantity": quantity,
                        "isLongTerm": False,
                        "formType": form_type
                    })
                    
                    total_proceeds += proceeds
                    total_cost_basis += cost_basis
                    total_wash_sale += wash_sale
                    total_net_gain += net_gain
                    
                except Exception as e:
                    print(f"IBKR 거래 파싱 오류: {e}", file=sys.stderr)
                    continue
        
        # 거래를 찾았으면 다른 패턴은 시도하지 않음
        if transactions:
            print(f"패턴 {pattern_idx + 1}로 {len(transactions)}개 거래 발견", file=sys.stderr)
            break
    
    if transactions:
        print(f"Interactive Brokers 거래 {len(transactions)}개 파싱 완료", file=sys.stderr)
        
        return {
            "totalProceeds": total_proceeds,
            "totalCostBasis": total_cost_basis,
            "totalNetGainLoss": total_net_gain,
            "totalWashSaleLoss": total_wash_sale,
            "shortTermProceeds": total_proceeds,
            "shortTermCostBasis": total_cost_basis,
            "shortTermNetGainLoss": total_net_gain,
            "longTermProceeds": 0,
            "longTermCostBasis": 0,
            "longTermNetGainLoss": 0,
            "transactions": transactions
        }
    
    print("Interactive Brokers 거래 패턴을 찾지 못했습니다", file=sys.stderr)
    return None

def parse_schwab_td_pdf(text: str) -> Dict[str, Any]:
    """Charles Schwab / TD Ameritrade 1099-B PDF 파싱"""
    print("Schwab/TD Ameritrade 파싱 시작", file=sys.stderr)
    
    # TODO: Schwab/TD 전용 파싱 로직 구현
    # Schwab과 TD는 보통 표 형태로 되어 있음
    
    return None

def parse_fidelity_pdf(text: str) -> Dict[str, Any]:
    """Fidelity 1099-B PDF 파싱"""
    print("Fidelity 파싱 시작", file=sys.stderr)
    
    # TODO: Fidelity 전용 파싱 로직 구현
    
    return None

def main():
    if len(sys.argv) != 2:
        print("사용법: python3 brokerageParser.py <pdf_file_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        # PDF 텍스트 추출
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        
        print(f"PDF 텍스트 추출 완료: {len(text)} 문자", file=sys.stderr)
        
        # 증권사 식별
        brokerage = detect_brokerage(text)
        print(f"식별된 증권사: {brokerage}", file=sys.stderr)
        
        # 증권사별 파싱
        result = None
        
        if brokerage == 'robinhood':
            result = parse_robinhood_pdf(text)
        elif brokerage == 'interactive_brokers':
            result = parse_interactive_brokers_pdf(text)
        elif brokerage == 'schwab_td':
            result = parse_schwab_td_pdf(text)
        elif brokerage == 'fidelity':
            result = parse_fidelity_pdf(text)
        else:
            print(f"지원되지 않는 증권사: {brokerage}", file=sys.stderr)
            sys.exit(1)
        
        if result:
            # 공통 메타데이터 추가
            result["brokerage"] = brokerage
            result["accountNumber"] = "Unknown"
            result["taxpayerName"] = "Line"
            result["documentId"] = f"{brokerage}-1099B"
            
            print(json.dumps(result))
        else:
            print('{"error": "파싱 실패"}')
            
    except Exception as e:
        print(f'파싱 오류: {e}', file=sys.stderr)
        print('{"error": "파싱 실패"}')
        sys.exit(1)

if __name__ == "__main__":
    main()