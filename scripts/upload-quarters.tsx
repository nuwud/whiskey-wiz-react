import { setDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

// Your quarters data from the JSON files
const quartersData = {

          "0122": {
            "id": "111",
            "name": "First Release Ever",
            "startDate": "2021-11-01T00:00:00Z",
            "endDate": "2022-01-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Black Button Four Grain Straight Bourbon",
                "distillery": "Black Button Distilling",
                "proof": 84,
                "age": 2,
                "mashbill": "Bourbon",
                "description": "A four grain bourbon featuring corn, wheat, rye, and malted barley",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Kings County Distillery Straight Bourbon Whiskey",
                "distillery": "Kings County Distillery",
                "proof": 90,
                "age": 2,
                "mashbill": "Bourbon",
                "description": "A bourbon made with New York organic corn and English Golden Promise malt",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "OYO Oloroso Finished Wheat Whiskey Double Cask Collection",
                "distillery": "Middle West Spirits",
                "proof": 102,
                "age": 5,
                "mashbill": "Wheat",
                "description": "A wheat whiskey finished in Oloroso sherry casks",
                "difficulty": "intermediate",
                "score": "score"
              },
              "D": {
                "id": "D",
                "name": "291 Colorado Rye Barrel Proof Whiskey",
                "distillery": "291 Colorado Whiskey",
                "proof": 127,
                "age": 2,
                "mashbill": "Rye",
                "description": "A high-proof rye whiskey from Colorado",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0322": {
            "id": "0322",
            "name": "March 2022 Release",
            "startDate": "2022-03-01T00:00:00Z",
            "endDate": "2022-05-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "10th Mountain Rocky Mountain Crafted Bourbon",
                "distillery": "10th Mountain Distillery",
                "proof": 92,
                "age": 0,
                "mashbill": "Bourbon",
                "description": "A craft bourbon from 10th Mountain Distillery",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Single Barrel Wheat Whiskey",
                "distillery": "Drift Distillery",
                "proof": 90,
                "age": 2,
                "mashbill": "Wheat",
                "description": "A wheat whiskey from Drift Distillery",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Straight Rye Whiskey - Dark Pumpernickel",
                "distillery": "Middle West Spirits",
                "proof": 96,
                "age": 3,
                "mashbill": "Rye",
                "description": "A unique rye whiskey made with dark pumpernickel",
                "difficulty": "intermediate",
                "score": "score"
              },
              "D": {
                "id": "D",
                "name": "Sour Mash Bourbon",
                "distillery": "Corbin Cash",
                "proof": 106,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A high-proof bourbon from Corbin Cash",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0622": {
            "id": "0622",
            "name": "June 2022 Release",
            "startDate": "2022-06-01T00:00:00Z",
            "endDate": "2022-08-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Colkegan Single Malt Whiskey",
                "distillery": "Santa Fe Spirits",
                "proof": 92,
                "age": 3,
                "mashbill": "Single Malt",
                "description": "A mesquite smoked single malt whiskey",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Four Grain Straight Bourbon Whiskey",
                "distillery": "Black Button Distilling",
                "proof": 84,
                "age": 2,
                "mashbill": "Bourbon",
                "description": "A four grain bourbon with corn, wheat, rye, and malted barley",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Penelope Bourbon Barrel Strength Batch 10",
                "distillery": "Penelope Bourbon",
                "proof": 115.2,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A barrel strength bourbon with a four grain mashbill",
                "difficulty": "intermediate",
                "score": "score"
              },
              "D": {
                "id": "D",
                "name": "Northern Rye Single Barrel",
                "distillery": "Mammoth Distilling",
                "proof": 128,
                "age": 15,
                "mashbill": "Rye",
                "description": "A well-aged single barrel rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0922": {
            "id": "0922",
            "name": "September 2022 Release",
            "startDate": "2022-09-01T00:00:00Z",
            "endDate": "2022-11-30T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "American Single Malt Pinot Noir Cask",
                "distillery": "Westward Whiskey",
                "proof": 90,
                "age": 2,
                "mashbill": "Single Malt",
                "description": "A single malt finished in Pinot Noir casks",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Single Barrel Bourbon",
                "distillery": "Bad Dog Distillery",
                "proof": 100,
                "age": 3,
                "mashbill": "Bourbon",
                "description": "A single barrel bourbon with high malt content",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Rye Whiskey Batch #12",
                "distillery": "Re:Find Distillery",
                "proof": 93,
                "age": 3,
                "mashbill": "Rye",
                "description": "A rye whiskey with a proprietary blend of grains",
                "difficulty": "intermediate",
                "score": "score"
              },
              "D": {
                "id": "D",
                "name": "Captain Fletcher's Private Reserve Rye Malt",
                "distillery": "Tamar Distillery",
                "proof": 94.6,
                "age": 8,
                "mashbill": "Rye",
                "description": "A well-aged malted rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
           "1222": {
            "id": "1222",
            "name": "December 2022 Release",
            "startDate": "2022-12-01T00:00:00Z",
            "endDate": "2023-02-28T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Triple Smoke American Single Malt Whiskey",
                "distillery": "Corsair Distillery",
                "proof": 80,
                "age": 1,
                "mashbill": "Single Malt",
                "description": "A single malt whiskey made with cherrywood, beechwood, and peat smoked malts",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Broken Barrel - Barrel Pick Rye Whiskey",
                "distillery": "Broken Barrel Whiskey Co.",
                "proof": 106.4,
                "age": 3,
                "mashbill": "Rye",
                "description": "A high-rye whiskey with unique barrel finishing",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Cask Strength Private Reserve Blended Rye Whiskey",
                "distillery": "RY3 Whiskey",
                "proof": 120.6,
                "age": 3,
                "mashbill": "Rye",
                "description": "A blend of 14-year light whiskey, 4-year rye whiskey, and 3.5-year rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              },
              "D": {
                "id": "D",
                "name": "KROBAR Cask Strength Bourbon Whiskey",
                "distillery": "KROBAR Distillery",
                "proof": 117,
                "age": 3,
                "mashbill": "Bourbon",
                "description": "A cask strength bourbon with high rye content",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0323": {
            "id": "0323",
            "name": "March 2023 Release",
            "startDate": "2023-03-01T00:00:00Z",
            "endDate": "2023-05-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Single Barrel California Straight Bourbon Whiskey",
                "distillery": "Devils Creek Distillery",
                "proof": 102.6,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A California straight bourbon with balanced grain bill",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Single Barrel Straight Bourbon Whiskey",
                "distillery": "Frey Ranch Distillery",
                "proof": 122.2,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A four-grain bourbon from estate-grown grains",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Southern Star Paragon Single Barrel Wheated Straight Bourbon Whiskey",
                "distillery": "Southern Distilling Company",
                "proof": 116,
                "age": 6,
                "mashbill": "Bourbon",
                "description": "A wheated bourbon with high malt content",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0623": {
            "id": "0623",
            "name": "June 2023 Release",
            "startDate": "2023-06-01T00:00:00Z",
            "endDate": "2023-08-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Strange Collaboration - Pinot Noir finished Bourbon",
                "distillery": "Three Chord Bourbon",
                "proof": 99,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A bourbon finished in Pinot Noir casks",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Golden Promise Cask Strength Bourbon",
                "distillery": "Rocktown Distillery",
                "proof": 115,
                "age": 3,
                "mashbill": "Bourbon",
                "description": "A bourbon using Golden Promise malted barley",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "World's Best Dad Solera Blend Bourbon",
                "distillery": "Dark Door Spirits",
                "proof": 121,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A solera-aged bourbon blend",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0923": {
            "id": "0923",
            "name": "September 2023 Release",
            "startDate": "2023-09-01T00:00:00Z",
            "endDate": "2023-11-30T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Blue Label Straight Bourbon Whiskey",
                "distillery": "Chambers Bay Distillery",
                "proof": 95,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A straight bourbon with soft white wheat",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Bottled-in-Bond Bourbon",
                "distillery": "Whiskey Acres Distilling Co.",
                "proof": 100,
                "age": 5,
                "mashbill": "Bourbon",
                "description": "A bottled-in-bond bourbon using estate grains",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Gold Label Rye",
                "distillery": "Iowa Legendary Rye",
                "proof": 105,
                "age": 3,
                "mashbill": "Rye",
                "description": "A 100% rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "1223": {
            "id": "1223",
            "name": "December 2023 Release",
            "startDate": "2023-12-01T00:00:00Z",
            "endDate": "2024-02-28T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "The QuintEssential American Single Malt Whiskey",
                "distillery": "Cedar Ridge Distillery",
                "proof": 92,
                "age": 6,
                "mashbill": "Single Malt",
                "description": "A blend of 5-8 year old single malt whiskeys",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Kentucky Straight Rye Whiskey Batch 16",
                "distillery": "MB Roland Distillery",
                "proof": 106.9,
                "age": 2,
                "mashbill": "Rye",
                "description": "A Kentucky-style rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Single Barrel Kentucky Straight Bourbon Whiskey Mash Bill 1",
                "distillery": "Casey Jones Distillery",
                "proof": 111.5,
                "age": 3,
                "mashbill": "Bourbon",
                "description": "A high-corn Kentucky bourbon",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "0324": {
            "id": "0324",
            "name": "March 2024 Release",
            "startDate": "2024-03-01T00:00:00Z",
            "endDate": "2024-05-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "American Straight Malt Whiskey",
                "distillery": "Ironton Distillery",
                "proof": 86,
                "age": 2,
                "mashbill": "Single Malt",
                "description": "A single malt using locally grown barley",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Bottled-in-Bond Straight Bourbon Whiskey",
                "distillery": "Leiper's Fork Distillery",
                "proof": 100,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A bottled-in-bond wheated bourbon",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Cask Strength Straight Bourbon Whiskey",
                "distillery": "Bull Run Distilling Company",
                "proof": 114,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A cask strength high-rye bourbon",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
        },
         "0624": {
            "id": "0624",
            "name": "June 2024 Release",
            "startDate": "2024-06-01T00:00:00Z",
            "endDate": "2024-08-31T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Axe Hole Single Malt Whiskey",
                "distillery": "Calwise Spirits Co.",
                "proof": 84,
                "age": 3,
                "mashbill": "Single Malt",
                "description": "A California single malt whiskey",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "UNBendt Straight Rye Whiskey Bottled-in-Bond",
                "distillery": "Bendt Distilling Co.",
                "proof": 100,
                "age": 5,
                "mashbill": "Rye",
                "description": "A bottled-in-bond rye with unique grain bill including triticale and specialty malts",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Old Monongahela Full Proof Rye Whiskey",
                "distillery": "Liberty Pole Spirits",
                "proof": 108,
                "age": 3,
                "mashbill": "Rye",
                "description": "A Pennsylvania-style rye whiskey with malted rye and wheat",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
        },
          "0924": {
            "id": "0924",
            "name": "September 2024 Release",
            "startDate": "2024-09-01T00:00:00Z",
            "endDate": "2024-11-30T23:59:59Z",
            "isActive": false,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "No. 14 - Bourbon Whiskey Finished with Pure Vermont Maple Syrup",
                "distillery": "Vermont Spirits Distilling Co.",
                "proof": 90,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A bourbon finished with Vermont maple syrup",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Straight Bourbon Whiskey",
                "distillery": "Kings County Distillery",
                "proof": 90,
                "age": 4,
                "mashbill": "Bourbon",
                "description": "A bourbon made with NY organic corn and Golden Promise barley",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Stock Exchange Club of Los Angeles Private Reserve Straight Rye Whiskey",
                "distillery": "R6 Distillery",
                "proof": 117.8,
                "age": 5,
                "mashbill": "Rye",
                "description": "A rye whiskey using pink and blue corn",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
          },
          "1224": {
            "id": "1224",
            "name": "December 2024 Release",
            "startDate": "2024-12-01T00:00:00Z",
            "endDate": "2025-02-28T23:59:59Z",
            "isActive": true,
            "difficulty": "intermediate",
            "samples": {
              "A": {
                "id": "A",
                "name": "Triple-Distilled Single Malt Whiskey",
                "distillery": "Andalusia Whiskey Co.",
                "proof": 100,
                "age": 4,
                "mashbill": "Single Malt",
                "description": "A triple-distilled American single malt",
                "difficulty": "intermediate",
                "score": "score"
              },
              "B": {
                "id": "B",
                "name": "Straight Bourbon Whiskey finished with Toasted Jupilles Fleur French Oak Staves",
                "distillery": "Dark Arts Whiskey House",
                "proof": 108,
                "age": 7,
                "mashbill": "Bourbon",
                "description": "A bourbon finished with French oak staves",
                "difficulty": "intermediate",
                "score": "score"
              },
              "C": {
                "id": "C",
                "name": "Cask Strength Straight Rye Whiskey",
                "distillery": "Taconic Distillery",
                "proof": 115,
                "age": 6,
                "mashbill": "Rye",
                "description": "A cask strength rye whiskey",
                "difficulty": "intermediate",
                "score": "score"
              }
            },
            "scoringRules": {
              "age": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerYear": 6,
                "pointDeductionPerYear": 6,
                "exactMatchBonus": 20,
                "minValue": 1,
                "maxValue": 10,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "proof": {
                "points": 35,
                "maxPoints": 35,
                "penaltyPerPoint": 3,
                "pointDeductionPerProof": 3,
                "exactMatchBonus": 20,
                "minValue": 80,
                "maxValue": 120,
                "hasLowerLimit": true,
                "hasUpperLimit": false,
                "gracePeriod": 1
              },
              "mashbill": {
                "points": 30,
                "maxPoints": 30,
                "pointDeductionPerType": 10,
                "exactMatchBonus": 20
              }
            }
        }
      }
      

// Function to upload all quarters
const uploadQuarters = async () => {
    try {
      for (const [quarterId, quarterData] of Object.entries(quartersData)) {
        const quarterRef = doc(db, 'quarters', quarterId);
        await setDoc(quarterRef, quarterData);
        console.log(`Successfully uploaded quarter ${quarterId}`);
      }
      console.log('All quarters uploaded successfully');
    } catch (error) {
      console.error('Error uploading quarters:', error);
    }
  };
  
  // Run the upload
  uploadQuarters();