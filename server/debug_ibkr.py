#!/usr/bin/env python3
"""
Interactive Brokers PDF 디버깅 스크립트
실제 거래 라인 패턴 분석
"""

import pdfplumber
import sys
import re

def analyze_ibkr_pdf(pdf_path):
    print(f"IBKR PDF 분석 시작: {pdf_path}", file=sys.stderr)
    
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    
    lines = text.split('\n')
    print(f"총 {len(lines)}개 라인 추출", file=sys.stderr)
    
    # 숫자 패턴이 있는 라인들 찾기 (거래 데이터)
    number_pattern = r'[\d,]+\.\d{2}'
    
    transaction_lines = []
    for i, line in enumerate(lines):
        if line.strip():
            # 4개 이상의 숫자가 있는 라인 찾기
            numbers = re.findall(number_pattern, line)
            if len(numbers) >= 4:
                transaction_lines.append((i, line.strip()))
                print(f"거래 후보 라인 {i}: {line.strip()}", file=sys.stderr)
                print(f"  발견된 숫자들: {numbers}", file=sys.stderr)
    
    # ELI LILLY 관련 라인들
    for i, line in enumerate(lines):
        if 'ELI' in line.upper() or 'LILLY' in line.upper():
            print(f"ELI LILLY 라인 {i}: {line.strip()}", file=sys.stderr)
    
    # 가능한 거래 패턴들 시도
    patterns = [
        # 기본 패턴
        r'([A-Z\s&\.]+?)\s+(\d+)\s+([A-Z]+)\s+(\d+)\s+([AB])\s+(SALE|PURCHASE)\s+(\d{1,2}/\d{1,2}/\d{4})\s+(\d{1,2}/\d{1,2}/\d{4}|\w+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        # 간단한 패턴
        r'([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,\-]+\.\d{2})',
        # 더 유연한 패턴
        r'.*?([\d,]+\.\d{2}).*?([\d,]+\.\d{2}).*?([\d,]+\.\d{2}).*?([\d,\-]+\.\d{2})'
    ]
    
    for pattern_idx, pattern in enumerate(patterns):
        print(f"\n패턴 {pattern_idx + 1} 테스트:", file=sys.stderr)
        matches = 0
        for line in lines:
            if re.search(pattern, line):
                matches += 1
                match = re.search(pattern, line)
                if match:
                    print(f"  매치: {line.strip()}", file=sys.stderr)
                    print(f"  그룹들: {match.groups()}", file=sys.stderr)
                if matches >= 3:  # 처음 3개만 보기
                    break
        
        if matches == 0:
            print(f"  매치 없음", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python3 debug_ibkr.py <pdf_file>", file=sys.stderr)
        sys.exit(1)
    
    analyze_ibkr_pdf(sys.argv[1])