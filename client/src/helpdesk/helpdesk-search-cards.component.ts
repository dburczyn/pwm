/*
 * Password Management Servlets (PWM)
 * http://www.pwm-project.org
 *
 * Copyright (c) 2006-2009 Novell, Inc.
 * Copyright (c) 2009-2018 The PWM Project
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */


import {Component} from '../component';
import {IPeopleService} from '../services/people.service';
import {IQService, IScope} from 'angular';
import {IHelpDeskConfigService} from '../services/helpdesk-config.service';
import LocalStorageService from '../services/local-storage.service';
import HelpDeskSearchBaseComponent from './helpdesk-search-base.component';
import SearchResult from '../models/search-result.model';
import {IPerson} from '../models/person.model';

@Component({
    stylesheetUrl: require('helpdesk/helpdesk-search.component.scss'),
    templateUrl: require('helpdesk/helpdesk-search-cards.component.html')
})
export default class HelpDeskSearchCardsComponent extends HelpDeskSearchBaseComponent {
    static $inject = [
        '$q',
        '$scope',
        '$state',
        '$stateParams',
        'ConfigService',
        'IasDialogService',
        'LocalStorageService',
        'PeopleService'
    ];
    constructor($q: IQService,
                $scope: IScope,
                private $state: angular.ui.IStateService,
                $stateParams: angular.ui.IStateParamsService,
                configService: IHelpDeskConfigService,
                IasDialogService: any,
                localStorageService: LocalStorageService,
                peopleService: IPeopleService) {
        super($q, $scope, $stateParams, configService, IasDialogService, localStorageService, peopleService);
    }

    $onInit() {
        this.initialize();
        this.fetchData();

        this.configService.photosEnabled().then((photosEnabled: boolean) => {
            this.photosEnabled = photosEnabled;
        });
    }

    fetchData() {
        let searchResult = this.fetchSearchData();
        if (searchResult) {
            searchResult.then(this.onSearchResult.bind(this));
        }
    }

    gotoTableView(): void {
        this.$state.go('search.table', {query: this.query});
    }

    private onSearchResult(searchResult: SearchResult): void {
        // Aborted request
        if (!searchResult) {
            return;
        }

        this.searchResult = new SearchResult({
            sizeExceeded: searchResult.sizeExceeded,
            searchResults: []
        });

        this.pendingRequests = searchResult.people.map(
            (person: IPerson) => {
                // Store this promise because it is abortable
                let promise = this.peopleService.getPerson(person.userKey);

                promise
                    .then(function(person: IPerson) {
                            // Aborted request
                            if (!person) {
                                return;
                            }

                            // searchResult may be overwritten by ESC->[LETTER] typed in after a search
                            // has started but before all calls to peopleService.getPerson have resolved
                            if (this.searchResult) {
                                this.searchResult.people.push(person);
                            }
                        }.bind(this),
                        (error) => {
                            // self.setErrorMessage(error);
                        })
                    .finally(() => {
                        // self.removePendingRequest(promise);
                    });

                return promise;
            },
            this
        );
    }
}
