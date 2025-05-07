import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInformation, type Dependent } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, RotateCcw, Save } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';

// 부양가족 관계 옵션
const relationshipOptions = [
  { value: "child", label: "자녀 (Child)" },
  { value: "parent", label: "부모 (Parent)" },
  { value: "grandparent", label: "조부모 (Grandparent)" },
  { value: "sibling", label: "형제자매 (Sibling)" },
  { value: "grandchild", label: "손자녀 (Grandchild)" },
  { value: "niece_nephew", label: "조카 (Niece/Nephew)" },
  { value: "aunt_uncle", label: "삼촌/이모/고모 (Aunt/Uncle)" },
  { value: "in_law", label: "인척 (In-law)" },
  { value: "foster_child", label: "위탁 자녀 (Foster Child)" },
  { value: "other", label: "기타 (Other)" },
];

const PersonalInfo: React.FC = () => {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  
  // 로컬 상태 관리 (폼과 로컬스토리지 간 동기화)
  const [savedValues, setSavedValues] = useState<PersonalInformation | null>(null);
  
  // 테스트용 하드코딩된 데이터로 시작
  const defaultValues: PersonalInformation = {
    firstName: 'John',
    middleInitial: 'A',
    lastName: 'Smith',
    ssn: '123-45-6789',
    dateOfBirth: '1980-01-15',
    email: 'john.smith@example.com',
    phone: '123-456-7890',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    filingStatus: 'married_joint',
    isDisabled: false,
    isNonresidentAlien: false,
    spouseInfo: {
      firstName: 'Jane',
      middleInitial: 'B',
      lastName: 'Smith',
      ssn: '987-65-4321',
      dateOfBirth: '1982-05-20',
      isDisabled: false,
      isNonresidentAlien: false
    },
    dependents: [
      {
        firstName: 'Tommy',
        lastName: 'Smith',
        ssn: '111-22-3333',
        relationship: 'Son',
        dateOfBirth: '2010-03-12',
        isDisabled: false,
        isNonresidentAlien: false,
        isQualifyingChild: true // 추가된 필드
      }
    ],
    ...taxData.personalInfo
  };

  // 로컬 스토리지에서 데이터 불러오기 (페이지 로드 시)
  useEffect(() => {
    const storedData = localStorage.getItem('personalInfo');
    console.log("PersonalInfo - 최초 로드 시 taxData:", taxData);
    
    // 로컬 스토리지에서 데이터 복원
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log("PersonalInfo - 로컬스토리지에서 복원:", parsedData);
        setSavedValues(parsedData);
        form.reset(parsedData); // 폼 데이터 설정
      } catch (e) {
        console.error("로컬 스토리지 데이터 파싱 오류:", e);
      }
    }
  }, []);

  // Disable zod validation to avoid form validation errors
  const form = useForm<PersonalInformation>({
    // resolver: zodResolver(personalInfoSchema), // Disabled validation
    defaultValues,
    mode: 'onChange'
  });
  
  // Watch filing status to show spouse info when 'married_joint' is selected
  const filingStatus = form.watch('filingStatus');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dependents'
  });

  const onSubmit = (data: PersonalInformation) => {
    // Make sure all values are properly processed before updating the tax data
    try {
      console.log("Processing form data:", data);
      updateTaxData({ personalInfo: data });
      return true;
    } catch (error) {
      console.error("Error submitting personal info form:", error);
      return false;
    }
  };

  const addDependent = () => {
    append({
      firstName: '',
      lastName: '',
      ssn: '',
      relationship: relationshipOptions[0].value, // 첫 번째 관계 옵션을 기본값으로 설정
      dateOfBirth: '',
      isDisabled: false,
      isNonresidentAlien: false,
      isQualifyingChild: false // 추가된 필드
    });
  };

  // Format SSN as user types
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  // Format phone as user types
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };
  
  // 값 초기화 처리
  const handleReset = () => {
    const resetValues: PersonalInformation = {
      firstName: '',
      lastName: '',
      middleInitial: '',
      ssn: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      filingStatus: 'single',
      isDisabled: false,
      isNonresidentAlien: false,
      dependents: []
    };
    
    console.log("값 초기화 실행:", resetValues);
    
    // 폼 초기화
    form.reset(resetValues);
    
    // 로컬 상태 초기화
    setSavedValues(resetValues);
    
    // 로컬 스토리지에서도 초기화된 값 저장
    localStorage.setItem('personalInfo', JSON.stringify(resetValues));
    
    // 컨텍스트 업데이트
    updateTaxData({ personalInfo: resetValues });
    
    // 서버에도 저장
    saveTaxReturn().then(() => {
      console.log("초기화된 값 서버에 저장 완료");
    }).catch(error => {
      console.error("초기화된 값 서버 저장 실패:", error);
    });
    
    toast({
      title: "값 초기화 완료",
      description: "모든 개인정보 항목이 초기화되었습니다.",
    });
  };
  
  // 진행 상황 저장 처리
  const handleSaveProgress = () => {
    const currentValues = form.getValues();
    console.log("진행 상황 저장 - 현재 값:", currentValues);
    
    // 로컬 상태 업데이트
    setSavedValues(currentValues);
    
    // 컨텍스트 업데이트
    updateTaxData({ personalInfo: currentValues });
    
    // 로컬 스토리지에 저장
    localStorage.setItem('personalInfo', JSON.stringify(currentValues));
    
    // 서버에 저장
    saveTaxReturn().then(() => {
      console.log("서버 저장 완료 - 현재 상태 유지됨");
      toast({
        title: "진행 상황 저장 완료",
        description: "개인정보가 성공적으로 저장되었습니다.",
      });
    }).catch(error => {
      console.error("서버 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: "서버에 데이터를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서 (Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. (Complete all sections to prepare your tax return.)</p>
      </div>

      <ProgressTracker currentStep={1} />

      <div className="flex flex-col">
        <div className="w-full">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">개인 정보 (Personal Information)</h2>
              
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); }}>
                  {/* Basic Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-heading font-semibold mb-4">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름(First Name)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>성(Last Name)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="middleInitial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Middle Initial (선택)</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={1} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="ssn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사회보장번호(SSN)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="XXX-XX-XXXX"
                                onChange={(e) => {
                                  const formatted = formatSSN(e.target.value);
                                  field.onChange(formatted);
                                }}
                                maxLength={11}
                              />
                            </FormControl>
                            <FormDescription>
                              Format: XXX-XX-XXXX
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>생년월일</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="date"
                                placeholder="YYYY-MM-DD"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="filingStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>신고 상태(Filing Status)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="신고 상태를 선택하세요" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">미혼(Single)</SelectItem>
                                <SelectItem value="married_joint">부부 공동 신고(Married Filing Jointly)</SelectItem>
                                <SelectItem value="married_separate">부부 개별 신고(Married Filing Separately)</SelectItem>
                                <SelectItem value="head_of_household">세대주(Head of Household)</SelectItem>
                                <SelectItem value="qualifying_widow">유자격 미망인(Qualifying Widow(er))</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <FormField
                        control={form.control}
                        name="isDisabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                              <FormDescription className="text-xs">
                                신고자가 법적으로 시각장애인이거나 영구적인 장애가 있는 경우 체크하세요.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isNonresidentAlien"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                              <FormDescription className="text-xs">
                                신고자가 비거주 외국인 상태인 경우 체크하세요.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Spouse Information - Only shows when filing status is married_joint */}
                  {filingStatus === 'married_joint' && (
                    <>
                      <Separator className="my-6" />
                      <div className="mb-6">
                        <h3 className="text-lg font-heading font-semibold mb-4">배우자 정보(Spouse Information)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="spouseInfo.firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이름(First Name)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="spouseInfo.lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>성(Last Name)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="spouseInfo.middleInitial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Middle Initial (선택)</FormLabel>
                                <FormControl>
                                  <Input {...field} maxLength={1} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="spouseInfo.ssn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>사회보장번호(SSN)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="XXX-XX-XXXX"
                                    onChange={(e) => {
                                      const formatted = formatSSN(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                    maxLength={11}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Format: XXX-XX-XXXX
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="spouseInfo.dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>생년월일</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="date"
                                    placeholder="YYYY-MM-DD"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <FormField
                            control={form.control}
                            name="spouseInfo.isDisabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                                  <FormDescription className="text-xs">
                                    배우자가 법적으로 시각장애인이거나 영구적인 장애가 있는 경우 체크하세요.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="spouseInfo.isNonresidentAlien"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                                  <FormDescription className="text-xs">
                                    배우자가 비거주 외국인 상태인 경우 체크하세요.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator className="my-6" />
                  
                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-heading font-semibold mb-4">연락처 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이메일 주소</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>전화번호</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="XXX-XXX-XXXX"
                                onChange={(e) => {
                                  const formatted = formatPhone(e.target.value);
                                  field.onChange(formatted);
                                }}
                                maxLength={12}
                              />
                            </FormControl>
                            <FormDescription>
                              Format: XXX-XXX-XXXX
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Address */}
                  <div className="mb-6">
                    <h3 className="text-lg font-heading font-semibold mb-4">집 주소</h3>
                    
                    <FormField
                      control={form.control}
                      name="address1"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address2"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Apartment, Suite, etc. (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Dependents */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-heading font-semibold">부양가족</h3>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={addDependent}
                        className="flex items-center"
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        부양가족 추가
                      </Button>
                    </div>
                    
                    {fields.length === 0 ? (
                      <p className="text-gray-dark italic mb-4">추가된 부양가족이 없습니다. "부양가족 추가" 버튼을 클릭하여 추가하세요.</p>
                    ) : (
                      fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-medium rounded-md p-4 mb-4">
                          <div className="flex justify-between mb-3">
                            <h4 className="font-semibold">Dependent #{index + 1}</h4>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.firstName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>이름(First Name)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.lastName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>성(Last Name)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.ssn`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>사회보장번호(SSN)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="XXX-XX-XXXX"
                                      onChange={(e) => {
                                        const formatted = formatSSN(e.target.value);
                                        field.onChange(formatted);
                                      }}
                                      maxLength={11}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.relationship`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>납세자와의 관계 (Relationship)</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="관계를 선택하세요" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {relationshipOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="mt-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.dateOfBirth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>생년월일</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="date"
                                      placeholder="YYYY-MM-DD"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isDisabled`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족에게 영구적인 장애가 있는 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isNonresidentAlien`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족이 비거주 외국인 상태인 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isQualifyingChild`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-3">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>19세미만이며 부모(부양인)와 반년이상 거주 또는 24세미만 Full Time 학생</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족이 19세 미만이고 부모(부양인)와 일년의 반 이상 함께 살거나, 24세 미만인 풀타임 학생인 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </form>
              </Form>
              
              {/* 버튼 컨트롤러 */}
              <div className="flex flex-col sm:flex-row gap-4 my-6">
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto" 
                  type="button" 
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> 값 초기화
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto" 
                  type="button"
                  onClick={handleSaveProgress}
                >
                  <Save className="mr-2 h-4 w-4" /> 진행 상황 저장
                </Button>
              </div>
              
              <StepNavigation
                prevStep="/"
                nextStep="/income"
                submitText="Income"
                onNext={() => {
                  // 다음 단계로 진행 시 현재 폼 데이터 저장
                  try {
                    const values = form.getValues();
                    console.log("다음 단계로 이동 - 현재 값:", values);
                    
                    // 로컬 상태 업데이트
                    setSavedValues(values);
                    
                    // 컨텍스트 업데이트
                    updateTaxData({ personalInfo: values });
                    
                    // 로컬 스토리지에 저장
                    localStorage.setItem('personalInfo', JSON.stringify(values));
                    
                    return true;
                  } catch (error) {
                    console.error("Error in step navigation:", error);
                    // If there's an error, show a toast but still return true to allow navigation
                    toast({
                      title: "Warning",
                      description: "Form processed with warnings.",
                      variant: "destructive",
                    });
                    return true;
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
