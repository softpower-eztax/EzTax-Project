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
import { PlusCircle, Trash2, ClipboardCheck, Save } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { useLocation } from 'wouter';

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
  const { taxData, updateTaxData, isDataReady } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // 새 사용자용 빈 기본값 (보안상 중요)
  const emptyDefaults: PersonalInformation = {
    firstName: '',
    middleInitial: '',
    lastName: '',
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
    dependents: [],
    spouseInfo: undefined
  };

  // TaxContext의 데이터만 사용 (보안 최우선)
  const defaultValues: PersonalInformation = taxData.personalInfo || emptyDefaults;

  const form = useForm<PersonalInformation>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues
  });

  const { fields: dependentFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dependents'
  });

  // Watch filing status to show spouse info when 'married_joint' is selected
  const filingStatus = form.watch('filingStatus');
  const [showSpouseInfo, setShowSpouseInfo] = useState(false);
  
  // 데이터가 로드되지 않았으면 로딩 표시 (모든 Hook 호출 이후)
  if (!isDataReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center">데이터 로딩 중...</div>
      </div>
    );
  }

  // TaxContext 데이터와 폼 동기화 - 보안 최우선
  useEffect(() => {
    console.log("PersonalInfo - TaxContext 데이터로 폼 초기화:", taxData.personalInfo);
    
    if (taxData.personalInfo) {
      form.reset(taxData.personalInfo);
    } else {
      // 인증되지 않은 사용자나 새 사용자는 빈 폼
      form.reset(emptyDefaults);
    }
  }, [taxData.personalInfo]); // TaxContext 데이터 변경 시에만 실행
  
  useEffect(() => {
    console.log("Current filing status:", filingStatus);
    const shouldShowSpouse = filingStatus === 'married_joint' || filingStatus === 'married_separate';
    setShowSpouseInfo(shouldShowSpouse);
    console.log("PersonalInfo - Should show spouse info:", shouldShowSpouse);
  }, [filingStatus]);

  const onSubmit = async (data: PersonalInformation) => {
    try {
      console.log("PersonalInfo - 폼 제출:", data);
      
      // TaxContext에 데이터 업데이트
      await updateTaxData({ personalInfo: data });
      
      toast({
        title: "저장 완료",
        description: "개인정보가 성공적으로 저장되었습니다.",
      });
      
      navigate('/income');
    } catch (error) {
      console.error("개인정보 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "개인정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const addDependent = () => {
    append({
      firstName: '',
      lastName: '',
      ssn: '',
      relationship: relationshipOptions[0].value,
      dateOfBirth: '',
      isDisabled: false,
      isNonresidentAlien: false,
      isQualifyingChild: true
    });
  };

  // Format SSN as user types
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
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
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <ProgressTracker currentStep="personal-info" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보 (Personal Information)</h1>
        <p className="text-gray-600">
          세금 신고서 작성을 위해 개인정보를 입력해주세요.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 기본 개인정보 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 (First Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="이름을 입력하세요" {...field} />
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
                      <FormLabel>중간 이름 (Middle Initial)</FormLabel>
                      <FormControl>
                        <Input placeholder="중간 이름 (선택사항)" maxLength={1} {...field} />
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
                      <FormLabel>성 (Last Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="성을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사회보장번호 (SSN)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXX-XX-XXXX" 
                          maxLength={11}
                          {...field}
                          onChange={(e) => {
                            const formatted = formatSSN(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>생년월일 (Date of Birth)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일 (Email)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="이메일 주소" {...field} />
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
                      <FormLabel>전화번호 (Phone)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXX-XXX-XXXX" 
                          maxLength={12}
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 주소 정보 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">주소 정보</h2>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소 1 (Address Line 1)</FormLabel>
                      <FormControl>
                        <Input placeholder="주소를 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소 2 (Address Line 2) - 선택사항</FormLabel>
                      <FormControl>
                        <Input placeholder="아파트, 동, 호수 등" {...field} />
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
                        <FormLabel>시/군 (City)</FormLabel>
                        <FormControl>
                          <Input placeholder="도시명" {...field} />
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
                        <FormLabel>주 (State)</FormLabel>
                        <FormControl>
                          <Input placeholder="주 코드 (예: TX)" {...field} />
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
                        <FormLabel>우편번호 (ZIP Code)</FormLabel>
                        <FormControl>
                          <Input placeholder="우편번호" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 신고 상태 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">신고 상태 (Filing Status)</h2>
              
              <FormField
                control={form.control}
                name="filingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>신고 상태</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="신고 상태를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">미혼 (Single)</SelectItem>
                        <SelectItem value="married_joint">부부합산신고 (Married Filing Jointly)</SelectItem>
                        <SelectItem value="married_separate">부부개별신고 (Married Filing Separately)</SelectItem>
                        <SelectItem value="head_of_household">세대주 (Head of Household)</SelectItem>
                        <SelectItem value="qualifying_widow">적격미망인 (Qualifying Widow(er))</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 배우자 정보 (결혼한 경우에만 표시) */}
          {showSpouseInfo && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">배우자 정보 (Spouse Information)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="spouseInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배우자 이름 (Spouse First Name)</FormLabel>
                        <FormControl>
                          <Input placeholder="배우자 이름" {...field} />
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
                        <FormLabel>배우자 성 (Spouse Last Name)</FormLabel>
                        <FormControl>
                          <Input placeholder="배우자 성" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spouseInfo.ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배우자 SSN (Spouse SSN)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="XXX-XX-XXXX" 
                            maxLength={11}
                            {...field}
                            onChange={(e) => {
                              const formatted = formatSSN(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="spouseInfo.dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배우자 생년월일 (Spouse Date of Birth)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* 부양가족 정보 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">부양가족 (Dependents)</h2>
                <Button type="button" onClick={addDependent} variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  부양가족 추가
                </Button>
              </div>

              {dependentFields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  부양가족이 없습니다. 위의 버튼을 클릭하여 추가하세요.
                </p>
              ) : (
                <div className="space-y-4">
                  {dependentFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">부양가족 {index + 1}</h3>
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="destructive"
                          size="sm"
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
                              <FormLabel>이름</FormLabel>
                              <FormControl>
                                <Input placeholder="부양가족 이름" {...field} />
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
                              <FormLabel>성</FormLabel>
                              <FormControl>
                                <Input placeholder="부양가족 성" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`dependents.${index}.ssn`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SSN</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="XXX-XX-XXXX" 
                                  maxLength={11}
                                  {...field}
                                  onChange={(e) => {
                                    const formatted = formatSSN(e.target.value);
                                    field.onChange(formatted);
                                  }}
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
                              <FormLabel>관계</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="관계 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipOptions.map((option) => (
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

                        <FormField
                          control={form.control}
                          name={`dependents.${index}.dateOfBirth`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>생년월일</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 저장 및 계속 버튼 */}
          <div className="flex justify-between">
            <Button type="button" variant="outline">
              이전 단계
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              저장하고 계속
            </Button>
          </div>
        </form>
      </Form>

      <StepNavigation currentStep="personal-info" />
    </div>
  );
};

export default PersonalInfo;